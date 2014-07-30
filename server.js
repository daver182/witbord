//Variables
var express = require('express'),
    http = require('http'),
    mongoose = require('mongoose');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var RedisStore = require('connect-redis')(express),
    sessionStore = new RedisStore,
    utils = require('./utils'),
    connect = require('express/node_modules/connect'),
    redis = require("redis"), 
    client = redis.createClient();

//var roomId = 1;

//Mongoose
db = mongoose.connect('mongodb://localhost/paint');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Users = new Schema({
  id       : ObjectId,
  name     : String,
  uid      : String,
  type : {
    id: String,
    name: String
  }
});

mongoose.model('users', Users);
var users = mongoose.model('users');

var Topics = new Schema({
  id: ObjectId,
  nameTopic: String,
  dateTopic: {type: Date, default: Date.now},
  userName: String,
  userId: String
});

mongoose.model('topics', Topics);
var topics = mongoose.model('topics');


//Redis status
client.on("error", function (err) {
    console.log("Error " + err);
});
client.on("ready", function (err) {
    console.log("Conectado a Redis");
});

//Cloudfoundry no soporta websockets, estableciendo por defecto xhr-polling 
io.set('transports', ['xhr-polling']);

//Socket.io Authorization
io.set('authorization', function (data, accept) {
  if(data.headers.cookie){
    var cookie = utils.parseCookie(data.headers.cookie),
    str = cookie['paint'];
    sid = connect.utils.parseSignedCookie(str, 'paint');
    
    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      data.user = session.user;
      return accept(null, true);
    });
  }else{
    return accept('No cookie transmitted.', false);
  }
});


io.of('/chat').on('connection', function (socket) {
  //Nueva conexion
  var hs = socket.handshake;
  socket.join(hs.user.idTopic);

  //users:create -> users.iobind(create)
  socket.broadcast.in(hs.user.idTopic).emit('users:create', hs.user);
  
  //users.fetch()
  socket.on('users:read', function (data, callback) {
    var currentUsers = [];
    var q = 0;
    var q2 = 0;
    client.smembers('rooms:' + hs.user.idTopic + ':users', function(err, data){
      data.forEach(function(u){
        if(u != hs.user._id){
          q++;
          users.findById(u, ['_id', 'name', 'type.id'],function(err, newUser){
            q2++;
            if(newUser){
              if(newUser.type.id != hs.user.id_type){
                currentUsers.push(newUser)
              }
              if(q == q2){
                  callback(null, currentUsers);
              }
            }
          });
        }
      });
    });
  });

  socket.on('change_orientation:out', function(orientation){
    client.set('rooms:' + hs.user.idTopic + ':users:' + hs.user._id + ':orientation', orientation, function(err){console.log(err)})
    socket.broadcast.in(hs.user.idTopic).emit('change_orientation:in', {id: hs.user._id, o: orientation});
  });

  socket.on('all_orientation:out', function(){
    var q = 0;
    var q2 = 0;
    var uOrientation = [];
    client.smembers('rooms:' + hs.user.idTopic + ':users', function(err, data){
      data.forEach(function(id){
        if(id != hs.user._id){
          q++;
          client.get('rooms:' + hs.user.idTopic + ':users:' + id + ':orientation', function (err, orientation) {
            q2++;
            uOrientation.push({id: id, o: orientation})
            if(q == q2){
              socket.in(hs.user.idTopic).emit('all_orientation:in', uOrientation);
            }
          });
        }
      });
    });
  });

  //Para que funcione en el caso de xhr-polling
  socket.on('user_out', function () {
    //socket.emit(delete.model) ->  model.iobind(delete)
    socket.in(hs.user.idTopic).emit('user/' + hs.user._id + ':delete', {id: hs.user._id, name: hs.user.name});
    socket.broadcast.in(hs.user.idTopic).emit('user/' + hs.user._id + ':delete', {id: hs.user._id, name: hs.user.name});
  });

  socket.on('disconnect', function () {
    //socket.emit(delete.model) ->  model.iobind(delete)
    socket.in(hs.user.idTopic).emit('user/' + hs.user._id + ':delete', {id: hs.user._id, name: hs.user.name});
    socket.broadcast.in(hs.user.idTopic).emit('user/' + hs.user._id + ':delete', {id: hs.user._id, name: hs.user.name});
  });

  //messages.fetch()
  socket.on('messages:read', function (data, callback) {
    var allMessages = [];
    client.lrange('rooms:' + hs.user.idTopic + ':messages', 0, -1, function(err, messages) {
      if(!err && messages){
        for (var i = 0; i < messages.length; i++) {
          var msg = JSON.parse(messages[i])
          allMessages.push(msg)
        };
        callback(null, allMessages);
      }else{
        console.log(err);
      }
    });
  });
  
  //Model.save()
  socket.on('message:create', function (data, callback) {
    var d1 = new Date();

    var dataRedis = {
      id: d1.getTime(),
      user_id: hs.user._id,
      user_name: hs.user.name,
      text: data.text
    };

    client.rpush('rooms:' + hs.user.idTopic + ':messages', JSON.stringify(dataRedis), function(err, ok) {
      if(!err && ok) {
        
      } else {
        console.log(err)
      }
    });

    //messages:create -> messages.iobind(create)
    socket.in(hs.user.idTopic).emit('messages:create', dataRedis);
    socket.broadcast.in(hs.user.idTopic).emit('messages:create', dataRedis);
  });

  //Update y delete no se aplican porque los messages no se pueden modificar ni eliminar
});

io.of('/paint').on('connection', function (socket) {
  //Nuevo usuario
  var hs = socket.handshake;
  
  //change user
  socket.on('change', function (data) {
    var lastRoom = getActualRoom();
    socket.leave(lastRoom);

    var tempId = 0;

    if(data.id == 0){
      tempId = hs.user._id;
    }else{
      tempId = data.id;
    }

    socket.join(tempId);
    socket.set('currentId', tempId, function(){});
    
    client.lrange('rooms:' + hs.user.idTopic + ':users:' + tempId + ':points', 0, -1, function(err, points) {
      if(!err && points){
        socket.in(tempId).emit('paint_all', points)
      }else{
        console.log(err);
      }
    });

    //
  });

  //paint out
  socket.on('paint_out', function (data){
    socket.get('currentId', function (err, currentId) {
      socket.broadcast.in(currentId).emit('paint_in', data);

      client.rpush('rooms:' + hs.user.idTopic + ':users:' + currentId + ':points', JSON.stringify(data), function(err, ok) {
        if(!err && ok) {
          
        } else {
          console.log(err)
        }
      });
    });
    
  });

  //click/touch up
  socket.on('mouse_up', function(){
    socket.get('currentId', function (err, currentId) {
      socket.broadcast.in(currentId).emit('mouse_in_up');
    });
  });

  socket.on('clear_canvas', function(){
    socket.get('currentId', function (err, currentId) {
      if(currentId == hs.user._id){
        client.del('rooms:' + hs.user.idTopic + ':users:' + currentId + ':points', function(){
          socket.in(currentId).emit('clear_canvas_in');
          socket.broadcast.in(currentId).emit('clear_canvas_in');
        });
      }
    });
  });

  function getActualRoom(){
    var rooms = io.sockets.manager.roomClients[socket.id];
    for (var field in rooms ){
        var roomList = field
    }
    var val = roomList.split('/');
    var lastRoom = val[val.length - 1];

    return lastRoom;
  }

  /*//socket.emit(update.model) ->  model.iobind(update)
    socket.emit('user/' + 1 + ':update', {id: 1, name: 'Daniel Vergara Uno'});
    socket.broadcast.emit('user/' + 1 + ':update', {id: 1, name: 'Daniel Vergara Uno'});

    //socket.emit(delete.model) ->  model.iobind(delete)
    socket.emit('user/' + 1 + ':delete', {id: 1, name: 'Daniel Vergara Uno'});
    socket.broadcast.emit('user/' + 1 + ':delete', {id: 1, name: 'Daniel Vergara Uno'});
  });*/
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: true });
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'paint',
    key: 'paint',
    store: sessionStore
  }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/main', function(req, res){
  res.render('main', {nameTopic: 'Nombre del tema', dateTopic: 'Fecha del tema'})
});

app.get('/', function(req, res){
  if(req.session.user){
    res.redirect('find_topics')
  }else{
    res.render('index')
  }
});

app.get('/enter', function(req, res){
  if(req.session.user){
    res.redirect('find_topics')
  }else{
    res.render('dropbox_auth')
  }
});

app.post('/check_user', function(req, res){
  if(req.session.user){
    res.redirect('find_topics')
  }else{
    var userData = {
      uid: req.body.idU, 
      name: req.body.nameU
    };
    req.session.user = userData;

    users.findOne({uid: req.body.idU}, function(err, user){
      if(!user){
        //Usuario no existe
        res.render('select_type');
      }else{
        //Usuario existe
        var tempUsr = req.session.user;
        tempUsr._id = user._id;
        tempUsr.type = {id: user.type.id, name: user.type.name}
        req.session.user = tempUsr;
        res.redirect('find_topics')
      }
    });
  }
});

app.post('/create_user', function(req, res){
  if(req.session.user){
    var user = req.session.user;
    var idType, name;

    if(req.body.type == 1){
      idType = 1;
      name = 'Profesor';
    }else{
      idType = 2;
      name = 'Alumno';
    }

    user.type = {id: idType, name: name}

    var newUser = new users({
      name: user.name,
      uid: user.uid,
      type : {
        id: idType,
        name: name
      }
    });
      

    newUser.save(function(err){
      if(err) console.log(err)
      user._id = newUser._id;
      req.session.user = user;
      res.redirect('find_topics');
    });
    
  }else{
    console.log('error de sesion')
  }
});

app.get('/find_topics', function(req, res){
  //Obtener temas de un profesor o para un alumno
  if(req.session.user){
    var user = req.session.user;

    if(user.type.id == 1){
      topics.find({userId: user._id}, function(err, userTopics){
        if(err) console.log(err)
        res.render('topics_t', {nameUser: user.name, topics: userTopics})
      });
    }else if(user.type.id == 2){
      topics.find({}, function(err, allTopics){
        if(err) console.log(err)
        users.find({'type.id': '1'}, function(err, usersFound){
          if(err) console.log(err)
          res.render('topics_a', {nameUser: user.name, topics: allTopics, users: usersFound})
        })
      });
    }
  }else{
    console.log('error de sesion')
  }
});


app.post('/create_topic', function(req, res){
  if(req.session.user){
    var user = req.session.user;

    var newTopic = new topics({
      nameTopic: req.body.topic_name,
      userName: user.name,
      userId: user._id
    });

    newTopic.save(function(err){
      if(err) console.log(err)
      user.idTopic = newTopic._id;

      client.sadd('rooms:' + user.idTopic + ':users', user._id)

      req.session.user = user;
      res.redirect('/board/' + newTopic._id)
    });
  }
});

app.get('/loadTopic/:id', function(req, res){
  if(req.session.user){
    var user = req.session.user;
    user.idTopic = req.params.id;

    client.sadd('rooms:' + user.idTopic + ':users', user._id)

    req.session.user = user;

    res.redirect('/board/' + req.params.id)
  }
});

app.get('/board/:id', function(req, res){
  if(req.session.user){
    var user = {};
    user.name = req.session.user.name;
    user.type = req.session.user.type.name;
    topics.findOne({_id: req.params.id}, function(err, topic){
      if(err) console.log(err)

      if(topic)
        res.render('main', {topic: topic, user: user});
    });
  }else{
    console.log('No hay usuario')
    res.redirect('/')
  }
});

app.get('/close_session', function(req, res){
  var user = req.session.user;
  
  client.srem('rooms:' + user.idTopic + ':users', user._id, function(err,num){console.log(num)})
  client.del('rooms:' + user.idTopic + ':users:' + user._id + ':orientation', function(err){console.log(err)})

  req.session.destroy(function(err){});
  res.redirect('/')
});

server.listen(3000, function(){
  //console.log("Express server listening on port %d in %s mode", server.address().port, server.settings.env);
});


/*
cliente             ->  servidor
model.save()        ->  socket.on(create.model)
collection.fetch()  ->  socket.on(read.collection)
model.save()        ->  socket.on(update.collection)
model.destroy()     ->  socket.on(delete.collection)

servidor            ->  cliente
socket.emit(create.collection) ->  collection.iobind(create)
socket.emit(update.model) ->  model.iobind(update)
socket.emit(delete.model) ->  model.iobind(delete)

*/