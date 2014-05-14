Paint.Collections.Messages = Backbone.Collection.extend({
    model: Paint.Models.Message,
    url: 'messages',
    socket: Paint.socketChat,
    initialize: function(){
        _.bindAll(this, 'serverCreate', 'collectionCleanup');
        this.ioBind('create', this.serverCreate, this);
    },
    serverCreate: function (data) {
        var exists = this.get(data.id);
        if (!exists) {
            this.add(data);
        } else {
            data.fromServer = true;
            exists.set(data);
        }
    },
    collectionCleanup: function (callback) {
        this.ioUnbindAll();
        this.each(function (model) {
            model.modelCleanup();
        });
        return this;
    }
});