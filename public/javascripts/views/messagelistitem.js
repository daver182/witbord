Paint.Views.MessageListItem = Backbone.View.extend({
    template: _.template($("#message-template").html()),

    initialize: function(model){
        _.bindAll(this, 'render', 'changeMessage');
        this.model.bind('change', this.changeMessage);
        this.render();
    },

    render: function(){
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    changeMessage: function(data){
        //this.$el.html(this.template(this.model.toJSON()));
    }
})