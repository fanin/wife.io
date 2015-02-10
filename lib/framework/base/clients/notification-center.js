var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var NotificationCenter = assign({}, EventEmitter.prototype, {
    /**
     * Attach Notification Center API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        var self = this;

        this.socket = _super.ioClient;
        this.APISpec = _super.apiSpec[0].Notification;

        this.socket.on(this.APISpec.Post.RES, function(notification) {
            self.emit(notification.category + "." + notification.name, notification.args);
        });
    },

    /**
     * Detach Notification Center API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.APISpec.Post.RES);
    },

    addObserver: function(category, name, handler) {
        this.on(category + "." + name, function(event, args) {
            handler && handler(args);
        });
    },

    removeObserver: function(category, name) {
        this.removeAllListeners(category + "." + name);
    }
});

module.exports = NotificationCenter;
