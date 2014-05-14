Paint.Views.UserListItem = Backbone.View.extend({
    template: _.template($("#user-template").html()),

    initialize: function(model){
        _.bindAll(this, 'render', 'changeUser');
        this.model.bind('change', this.changeUser);
        this.render();
    },

    render: function(){
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    changeUser: function(data){
        console.log(data)
        console.log(this.$el.find('#' + data))
    }
});