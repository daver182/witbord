Paint.Models.User = Backbone.Model.extend({
    urlRoot: 'user',
    idAttribute: "_id",
    noIoBind: false,
    socket: Paint.socketChat,
    initialize: function () {
        _.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');

        if (!this.noIoBind) {
            this.ioBind('update', this.serverChange, this);
            this.ioBind('delete', this.serverDelete, this);
        }
    },
    serverChange: function (data) {
        data.fromServer = true;
        this.set(data);
    },
    serverDelete: function (data) {
        console.log(data)
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