window.Paint = {
	Models: {},
	Collections: {},
	Views: {},
	Routes: {}
};

//window.Paint.socketChat = io.connect('http://witbord.cloudfoundry.com/chat');
//window.Paint.socketPaint = io.connect('http://witbord.cloudfoundry.com/paint');
window.Paint.socketChat = io.connect('http://192.168.0.13:3000/chat');
window.Paint.socketPaint = io.connect('http://192.168.0.13:3000/paint');
window.Paint.actualBoard = null;

window.DBclient = new Dropbox.Client({
	key: "rmxo1r3xtgn2zht", secret: "rx0a99kwu9pljh6", sandbox: true
});

window.DBclient.authDriver(new Dropbox.Drivers.Redirect({useQuery: false, rememberUser: true}));

window.DBclient.authenticate(function(error, client) {
	if (error) {
		console.log(error)
		return showError(error);
	}
});