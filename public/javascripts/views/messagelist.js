Paint.Views.MessageList = Backbone.View.extend({
    el: $('#chat-list'),

    initialize: function(messages){
        _.bindAll(this, 'render', 'addMessage', 'removeMessage');

        this.messages = messages;

        this.messages.bind('reset', this.render);
        this.messages.bind('add', this.addMessage);
        this.messages.bind('remove', this.removeMessage);

        this.render();
    },
    render: function(){
        var self = this;
        $(this.el).empty();
        this.messages.each(function (message) {
            var tdv = new Paint.Views.MessageListItem({ model: message });
            $(self.el).append(tdv.el);
        });
    },

    addMessage: function(message){
        var tdv = new Paint.Views.MessageListItem({ model: message });
        $(this.el).append(tdv.el);
    },

    removeMessage: function(message){
        this.$('#' + message.id).remove();
    }
});