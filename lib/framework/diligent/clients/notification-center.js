var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var NotificationCenter = assign({}, EventEmitter.prototype, {
    /**
     * Attach Notification Center API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {this.socket = _super.ioClient;
        this.wsapi = _super.wsapi[0].Notification;

        this.socket.on(this.wsapi.Post.RES, function(notification) {
            this.emit(notification.category + "." + notification.name, notification.args);
        }.bind(this));
    },

    /**
     * Detach Notification Center API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.wsapi.Post.RES);
    },

    addObserver: function(category, name, handler) {
        this.on(category + "." + name, function(args) {
            handler && handler(args);
        });
    },

    removeObserver: function(category, name, handler) {
        this.removeListener(category + "." + name, handler);
    },

    removeAllObserver: function(category, name) {
        this.removeAllListeners(category + "." + name);
    }
});

module.exports = NotificationCenter;
