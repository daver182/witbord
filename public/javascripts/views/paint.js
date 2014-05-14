Paint.Views.PaintView  = Backbone.View.extend({
    el: $('#container'),
    //template: _.template($("#paint-template").html()),
    socket: Paint.socketPaint,
    painting: false,
    points: Array(),

    initialize: function(users){
        _.bindAll(this, 'render', 'loadBoard', 'paintIn', 'paintAll', 'mouseInUp', 'borrarLienzo','clearCanvasIn', 'startDraw', 'moveDraw', 'stopDraw', 'changeColor' ,'changeYellow', 'changeBlue', 'changeOrange', 'changePink', 'changeGreen', 'changeRed', 'changeBlack', 'changeWhite', 'showSlider', 'initCanvas', 'showUsers', 'showChat', 'smoothLines', 'changeOrientationIn', 'allOrientationIn');
        this.socket.on('paint_in', this.paintIn)
        this.socket.on('paint_all', this.paintAll)
        this.socket.on('mouse_in_up', this.mouseInUp)
        this.socket.on('clear_canvas_in', this.clearCanvasIn)

        Paint.socketChat.on('change_orientation:in', this.changeOrientationIn)
        Paint.socketChat.on('all_orientation:in', this.allOrientationIn)
        this.render();

        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 0;
        this.pincelWidth = 1;

        this.canvas = this.$el.find('#main-canvas');

        this.canvas[0].addEventListener("touchstart", this.startDraw, false);
        this.canvas[0].addEventListener("touchmove", this.moveDraw, false);  
        this.canvas[0].addEventListener("touchend", this.stopDraw, false);

        this.pincel = this.canvas[0].getContext("2d");

        this.sizeShape = this.$el.find('#size-shape');
        this.sizeContainer = this.$el.find('#size-container'); 
        this.sliderContainer = this.$el.find('#slider-container');
        this.canvasContainer = this.$el.find('#canvas-container');

        this.usersContainer = this.$el.find('#users');
        this.chatContainer = this.$el.find('#chat');

        this.topicContainer = this.$el.find('#topic');
        this.userInfoContainer = this.$el.find('#user-info');

        this.notification = this.$el.find('#notification');

        Paint.appWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        Paint.appHeight = (window.innerHeight > 0) ? window.innerHeight : screen.height;
        
        if(window.appWidth <= 800){
            this.orientation = 'portrait';
        }else{
            this.orientation = 'landscape';
            this.sliderContainer.addClass("slider-invisible");
        }

        Paint.socketChat.emit('change_orientation:out', this.orientation);
        this.initCanvas();

        var self = this;
        window.addEventListener('orientationchange', function(e){
            if(window.orientation == 90 || window.orientation == -90){
                self.orientation = 'portrait';
                self.sliderContainer.removeClass("slider-invisible");
            }else if(window.orientation == 0 || window.orientation == 180){
                self.orientation = 'landscape';
                self.sliderContainer.addClass("slider-invisible");
            }
            Paint.socketChat.emit('change_orientation:out', self.orientation);
            self.initCanvas()
            self.loadBoard()
            
        });
    },
    render: function(event){},

    changeOrientationIn: function(data){
        if(data.o == 'landscape'){
            this.$el.find('#' + data.id + ' .image-user').removeClass('portrait')
            this.$el.find('#' + data.id + ' .image-user').addClass('landscape')
        }else{
            this.$el.find('#' + data.id + ' .image-user').removeClass('landscape')
            this.$el.find('#' + data.id + ' .image-user').addClass('portrait')
        }
    },

    allOrientationIn: function(data){
        for(var i = 0; i < data.length; i++){
            if(data[i].o == 'landscape'){
                this.$el.find('#' + data[i].id + ' .image-user').removeClass('portrait')
                this.$el.find('#' + data[i].id + ' .image-user').addClass('landscape')
            }else{
                this.$el.find('#' + data[i].id + ' .image-user').removeClass('landscape')
                this.$el.find('#' + data[i].id + ' .image-user').addClass('portrait')
            }
        }
    },

    initCanvas: function(orientation){
        window.appWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        window.appHeight = (window.innerHeight > 0) ? window.innerHeight : screen.height;

        if(this.orientation == 'landscape'){
            this.canvasWidth = window.appWidth - 59;
            this.canvasHeight = window.appHeight;
        }else if(this.orientation == 'portrait'){
            this.canvasWidth = window.appWidth;
            this.canvasHeight = window.appHeight - 59;
        }

        this.canvas[0].setAttribute('width', this.canvasWidth);
        this.canvas[0].setAttribute('height', this.canvasHeight);
        
        this.pincel.lineCap = "round";
        this.pincel.lineJoin = "round";
        this.pincel.lineWidth = this.pincelWidth;
        this.pincel.strokeStyle = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
    },

    events: {
        "click #clear-canvas": "borrarLienzo",
        "change #slider": "changeSlider",
        "click #yellow": "changeYellow",
        "click #blue": "changeBlue",
        "click #orange": "changeOrange",
        "click #pink": "changePink",
        "click #green": "changeGreen",
        "click #red": "changeRed",
        "click #black": "changeBlack",
        "click #white": "changeWhite",
        "click #slider-button": "showSlider",
        "click #users #head": "showUsers",
        "click #chat #head": "showChat",
        "click #save-canvas": "guardarLienzo",
        "click #logout": "salir",
    },

    changeYellow: function(){this.changeColor(251,241,32)},
    changeBlue: function(){this.changeColor(59,119,251)},
    changeOrange: function(){this.changeColor(225,133,30)},
    changePink: function(){this.changeColor(211,56,87)},
    changeGreen: function(){this.changeColor(105,216,23)},
    changeRed: function(){this.changeColor(212,53,14)},
    changeBlack: function(){this.changeColor(0,0,0)},
    changeWhite: function(){this.changeColor(255,255,255)},

    salir: function(){
        DBclient.signOut();
        Paint.socketChat.emit('user_out');
        window.location = "/close_session"
    },

    guardarLienzo: function(){
        var dataURI = this.canvas[0].toDataURL("image/png");
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        if (!window.BlobBuilder && window.WebKitBlobBuilder){
            window.BlobBuilder = window.WebKitBlobBuilder;
            var bb = new BlobBuilder();
            bb.append(ab);
            var blob = bb.getBlob(mimeString);
        }else{
            var blob = new Blob([new Uint8Array(ab)], {type: mimeString});
        }
        

        var nTopic = this.topicContainer.find('p').text();
        var dTopic = this.topicContainer.find('span').text();
        var uName = this.userInfoContainer.find('p').text();

        var path = nTopic + '_(' + dTopic + ').png';

        var self = this;
        DBclient.writeFile(path, blob, function(error, stat) {
            if (error) {
                self.showNotification(self, 'Ocurrio un error al guardar la imagen.')
            }else{
                self.showNotification(self, 'La imagen se ha guardado con exito.')
            }
        });
        

    },

    showNotification: function(context, message){
        context.notification.text(message)
        context.notification.toggleClass('notification-out')
        context.notification.toggleClass('notification-in')
        var msg = setInterval(
            function(){
                context.notification.toggleClass('notification-out');
                context.notification.toggleClass('notification-in');
                clearInterval(msg);
            },
        5000);
    },

    showUsers: function(){
        this.usersContainer.toggleClass("users-default");
        this.usersContainer.toggleClass("users-visible");
    },

    showChat: function(){
        this.chatContainer.toggleClass("chat-visible");
    },

    showSlider: function(){
        this.sliderContainer.toggleClass("slider-invisible");
    },

    changeSlider: function(e){
        var value = $(e.currentTarget).val();
        this.pincel.lineWidth = value;
        this.pincelWidth = value;

        var oldWidth = this.sizeShape.width();
        
        this.sizeShape.css('width', value)
        this.sizeShape.css('height', value)

        var t = (this.sizeContainer.width() - value)/2;

        this.sizeShape.css('left', t)
        this.sizeShape.css('top', t)
    },

    borrarLienzo: function(){
        this.socket.emit('clear_canvas')
    },

    changeColor: function(red, green, blue){
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.pincel.strokeStyle = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
        this.sizeShape.css('background', 'rgb('+this.red+','+this.green+','+this.blue+')')
    },

    clearCanvasIn: function(){
        this.clearCanvas(this.pincel)
        this.points = [];
    },

    loadBoard: function (){
        this.clearCanvas(this.pincel)
        this.points = [];
        
        var users = this.$el.find('.actual-user');
        for (var i = 0; i < users.length; i++) {
            this.$el.find(users[i]).addClass('inactive');
            this.$el.find(users[i]).removeClass('active');
        }

        if(Paint.actualBoard != 0){
            this.$el.find('#' + Paint.actualBoard + ' .actual-user').removeClass('inactive');
            this.$el.find('#' + Paint.actualBoard + ' .actual-user').addClass('active');
        }
        
        this.socket.emit('change', {id: Paint.actualBoard, orientation: this.orientation})
    },

    startDraw: function(e){
        this.painting = true;
        finger = e.touches[0];
        e.preventDefault();

        var x = finger.pageX - this.canvasContainer[0].offsetLeft;
        var y = finger.pageY - this.canvasContainer[0].offsetTop;

        this.userInfoContainer.toggleClass("invisible");
        this.topicContainer.toggleClass("invisible");

        this.pincel.beginPath();
        this.pincel.moveTo(x,y);
        this.socket.emit('paint_out', [x, y, this.red, this.green, this.blue, this.pincel.lineWidth, 0]);
        this.points.push([x, y, this.red, this.green, this.blue, this.pincel.lineWidth, 0])
        
        
    },

    moveDraw: function(e){
        if(this.painting){
            finger = e.touches[0];
            e.preventDefault();

            var x = finger.pageX - this.canvasContainer[0].offsetLeft
            var y = finger.pageY - this.canvasContainer[0].offsetTop;

            this.pincel.lineTo(x,y);
            this.pincel.stroke();
            
            this.pincel.closePath();

            this.pincel.beginPath();
            this.pincel.moveTo(x,y);
            this.socket.emit('paint_out', [x, y, this.red, this.green, this.blue, this.pincel.lineWidth, 1]);

            this.points.push([x, y, this.red, this.green, this.blue, this.pincel.lineWidth, 1])
            
        }
    },

    stopDraw: function(e){
        this.painting = false;
        this.userInfoContainer.toggleClass("invisible");
        this.topicContainer.toggleClass("invisible");
        
        this.socket.emit('mouse_up');
        this.smoothLines();
        
    },

    smoothLines: function(){
        this.clearCanvas(this.pincel)
        var temp = [];
        
        for(var j = 0; j < this.points.length; j++){
            var point = this.points[j];
            
            if(point[6] == 0 && j != 0){
                this.drawPoints(temp, this.pincel);
                temp = [];
                temp.push(point);
            }else{
                temp.push(point);
            }
        }
        

        this.drawPoints(temp, this.pincel);
    },

    drawPoints: function(p, pincel){
        if (p.length < 6) return;

        pincel.beginPath(); 
        pincel.moveTo(p[0][0], p[0][1]);
        for (var i = 1; i < p.length - 2; i++) {
            var c = (p[i][0] + p[i + 1][0]) / 2,
                d = (p[i][1] + p[i + 1][1]) / 2;
            pincel.quadraticCurveTo(p[i][0], p[i][1], c, d);
        }
        pincel.strokeStyle = 'rgb(' + p[i][2] + ',' + p[i][3] + ',' + p[i][4] + ')';
        pincel.lineWidth = p[i][5];
        pincel.quadraticCurveTo(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]); 
        pincel.stroke();

        return true;
    },

    paintIn: function(array){
        //this.pincel.save();
        switch (array[6]) {
            case 0:
                this.pincel.strokeStyle = 'rgb(' + array[2] + ',' + array[3] + ',' + array[4] + ')';
                this.pincel.lineWidth = array[5];
                this.pincel.beginPath();
                this.pincel.moveTo(array[0],array[1]);
                break;
            case 1:
                this.pincel.strokeStyle = 'rgb(' + array[2] + ',' + array[3] + ',' + array[4] + ')';
                this.pincel.lineTo(array[0],array[1]);
                this.pincel.stroke();
                this.pincel.moveTo(array[0],array[1]);
                this.pincel.closePath();
                break;
            default:
                break;
        }
        this.points.push(array)
        this.pincel.restore();
    },

    paintAll: function(data){
        this.pincel.save();
        for(j = 0; j < data.length; j++){
            var point = JSON.parse(data[j]);
            this.points.push(point)
        }
        this.smoothLines();
        this.pincel.restore();
    },

    mouseInUp: function(){
        this.smoothLines();
    },

    clearCanvas: function(p){
        p.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        p.fillStyle = '#fff';
        p.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
});