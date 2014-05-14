Paint.Routes.MainRouter = Backbone.Router.extend({
    initialize: function () {
        this.users = new Paint.Collections.Users();
        this.userList = new Paint.Views.UserList(this.users);
        this.paintView = new Paint.Views.PaintView();
        this.users.fetch();

        this.messages = new Paint.Collections.Messages();
        this.messageList = new Paint.Views.MessageList(this.messages);
        this.messages.fetch();

        this.messageInput = new Paint.Views.MessageInput(this.messages);

    },

    routes: {
        "": "home",
        "user/:id" : "getUser",
        "*other"    : "defaultRoute"
    },

    home: function(){
        Paint.actualBoard = 0;
        this.paintView.loadBoard()
    },

    getUser: function(id){
        //console.log("You are trying to reach user " + id);
        Paint.actualBoard = id;
        this.paintView.loadBoard()
    },

    defaultRoute: function(other){
        console.log("Invalid. You attempted to reach:" + other);
    }
});
