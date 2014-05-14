exports.filtrarMensajes= function(mensajes, searchStr) {
  var returnArray = [];
  
  for (i = 0; i < mensajes.length; i++) {
    if(mensajes[i][0] == searchStr) {
      returnArray.push(mensajes[i][1]);
    }
  }
  return returnArray;
}

exports.buscarUsuario = function (id, users, fn){
  for (var i = 0; i < users.length; i++){
    if(users[i]['id'] == id){
      fn(users[i])
    }
  }
}

exports.filtrarTipos = function (users, usuario, fn){
  var lista = [];
  for (var i = 0; i < users.length; i++){
    if(users[i]['tipo'] != usuario.tipo){
      lista.push(users[i])
    }
  }

  fn(lista);
}

exports.parseCookie = function(str){
  var obj = {}
    , pairs = str.split(/[;,] */);
  for (var i = 0, len = pairs.length; i < len; ++i) {
    var pair = pairs[i]
      , eqlIndex = pair.indexOf('=')
      , key = pair.substr(0, eqlIndex).trim().toLowerCase()
      , val = pair.substr(++eqlIndex, pair.length).trim();

    // quoted values
    if ('"' == val[0]) val = val.slice(1, -1);

    // only assign once
    if (undefined == obj[key]) {
      val = val.replace(/\+/g, ' ');
      try {
        obj[key] = decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          obj[key] = val;
        } else {
          throw err;
        }
      }
    }
  }
  return obj;
};