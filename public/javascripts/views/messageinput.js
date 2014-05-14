Paint.Views.MessageInput = Backbone.View.extend({
    el: $('#input-chat'),

    initialize: function(messages){
        _.bindAll(this, 'sendMessage');
        this.messages = messages;
    },

    events: {
        "click #send-message": "sendMessage",
    },

    sendMessage: function(){
        var Message = Paint.Models.Message.extend({ noIoBind: true });
    
        var attrs = {
          //user_name: 'Daniel Vergara 1',
          text: this.$('#message-text').val()
        };
        
        //this.$('#TodoInput input[name="TodoInput"]').val('');
        this.$('#message-text').val('')
        
        var _message = new Paint.Models.Message(attrs);
        _message.save();
    }
});