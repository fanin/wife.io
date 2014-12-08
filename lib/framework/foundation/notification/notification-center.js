function NotificationCenter() {}

extend(NotificationCenter.prototype, Event.prototype);

NotificationCenter.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.protoNotification = _super.protocol[0].Notification;

    this.socket.on(this.protoNotification.Post.RES, function(notification) {
        self.event.trigger(notification.category + "." + notification.name, notification.args);
    });
}

NotificationCenter.prototype.detach = function() {
    this.socket.removeAllListeners(this.protoNotification.Post.RES);
}

NotificationCenter.prototype.addObserver = function(category, name, handler) {
    this.event.on(category + "." + name, function(event, args) {
        handler && handler(args);
    });
}

NotificationCenter.prototype.removeObserver = function(category, name) {
    this.event.off(category + "." + name);
}
