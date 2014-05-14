//var socket = io.connect('http://192.168.0.100:3000/paint'); 
window.WB = {};
WB.board = {
    ctx: null,
	canvas: null,
	canvasId: null,
	canvasWidth: null,
	canvasHeight: null,
    canvasColor: {},
	strokeWidth: null,
	points: Array(),
	orientationListener: null,
  painting: false,
  configured: false,

	startDraw: function(e){
		painting = true;
        finger = e.touches[0];
        e.preventDefault();

        var x = finger.pageX - canvas.offsetLeft;
        var y = finger.pageY - canvas.offsetTop;

        ctx.beginPath();
        ctx.moveTo(x,y);

        //socket.emit('paint_out', [x, y, canvasColor.red, canvasColor.green, canvasColor.blue, strokeWidth, 0]);
        points.push([x, y, canvasColor.red, canvasColor.green, canvasColor.blue, strokeWidth, 0]);
	},
	moveDraw: function(e){
		if(painting){
            finger = e.touches[0];
            e.preventDefault();

            var x = finger.pageX - canvas.offsetLeft;
            var y = finger.pageY - canvas.offsetTop;

            ctx.lineTo(x,y);
            ctx.stroke();
            
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(x,y);
            //socket.emit('paint_out', [x, y, canvasColor.red, canvasColor.green, canvasColor.blue, strokeWidth, 1]);
            points.push([x, y, canvasColor.red, canvasColor.green, canvasColor.blue, strokeWidth, 1]);
            
        }
	},
	stopDraw: function(e){
		painting = false;
        //socket.emit('mouse_up');
		smoothLines();
	},

	init: function(){
		if(configured){
			canvas = getElementById(canvasId);
			drawCanvas(canvasWidth, canvasHeight);
			canvas.addEventListener("touchstart", startDraw, false);
			canvas.addEventListener("touchmove", moveDraw, false);  
			canvas.addEventListener("touchend", stopDraw, false);
			ctx = canvas.getContext("2d");

			window.addEventListener('orientationchange', orientationListener);
		}
	},
	drawCanvas: function(cWidth, cHeight){
		canvas.setAttribute('width', cWidth);
		canvas.setAttribute('height', cHeight);
	},

	configure: function(cId, cWidth, cHeight, cColor, sWidth, oListener){
		canvasId = cId;
		canvasWidth = cWidth;
		canvasHeight = cHeight;

		canvasColor.red = cColor.red;
		canvasColor.green = cColor.green;
		canvasColor.blue = cColor.blue;
		canvasColor.alpha = cColor.alpha;

		strokeWidth = sWidth;
		orientationListener = oListener;

		configured = true;
	},
	setChannel: function(){

	},

	clearCanvas: function(){
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    },

	smoothLines: function(){
        clearCanvas(ctx);
        var temp = [];
        
        for(var j = 0; j < points.length; j++){
            var point = points[j];
            
            if(point[6] === 0 && j !== 0){
                drawPoints(temp, ctx);
                temp = [];
                temp.push(point);
            }else{
                temp.push(point);
            }
        }
        drawPoints(temp, ctx);
    },

    drawPoints: function(p){
        if (p.length < 6) return;

        ctx.beginPath(); 
        ctx.moveTo(p[0][0], p[0][1]);
        for (var i = 1; i < p.length - 2; i++) {
            var c = (p[i][0] + p[i + 1][0]) / 2,
                d = (p[i][1] + p[i + 1][1]) / 2;
            ctx.quadraticCurveTo(p[i][0], p[i][1], c, d);
        }
        ctx.strokeStyle = 'rgb(' + p[i][2] + ',' + p[i][3] + ',' + p[i][4] + ')';
        ctx.lineWidth = p[i][5];
        ctx.quadraticCurveTo(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]); 
        ctx.stroke();

        return true;
    }
};

var color = {red: 255, green: 0, blue: 0, alpha: 1};
WB.board.configure('lienzo1', 100, 100, color, 10);