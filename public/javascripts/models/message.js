Paint.Models.Message = Backbone.Model.extend({
    urlRoot: 'message',
    socket: Paint.socketChat,
    initialize: function(){
        _.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');
        this.ioBind('update', this.serverChange, this);
        this.ioBind('delete', this.serverDelete, this);
    },
    serverChange: function (data) {
        data.fromServer = true;
        this.set(data);
    },
    serverDelete: function (data) {
        if (this.collection) {
          this.collection.remove(this);
        } else {
          this.trigger('remove', this);
        }
        this.modelCleanup();
    },
    modelCleanup: function () {
        this.ioUnbindAll();
        return this;
    }
});