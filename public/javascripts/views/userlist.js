Paint.Views.UserList = Backbone.View.extend({
    el: $('#user-list'),

    initialize: function(users){
        _.bindAll(this, 'render', 'addUser', 'removeUser');
        this.users = users;

        this.users.bind('reset', this.render);
        this.users.bind('add', this.addUser);
        this.users.bind('remove', this.removeUser);

        this.render();
    },

    render: function(){
        var self = this;
        $(this.el).empty();
        this.users.each(function (user) {
            var tdv = new Paint.Views.UserListItem({ model: user });
            $(self.el).append(tdv.el);
        });
        Paint.socketChat.emit('all_orientation:out');

        var users = this.$el.find('.actual-user');
        for (var i = 0; i < users.length; i++) {
            this.$el.find(users[i]).addClass('inactive');
            this.$el.find(users[i]).removeClass('active');
        }

        if(Paint.actualBoard != 0){
            this.$el.find('#' + Paint.actualBoard + ' .actual-user').removeClass('inactive');
            this.$el.find('#' + Paint.actualBoard + ' .actual-user').addClass('active');
        }
    },

    addUser: function(user){
        console.log(user)
        var tdv = new Paint.Views.UserListItem({ model: user });
        $(this.el).append(tdv.el);
    },

    removeUser: function(user){
        console.log(user)
        this.$('#' + user.id).remove();
    }
});