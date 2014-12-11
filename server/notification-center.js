module.exports = NotificationCenter;

function NotificationCenter() {}

NotificationCenter.prototype.register = function(_super, socket, protoNotification, complete) {
    var self = this;

    self.socket = socket;
    self.protoNotification = protoNotification;

    complete && complete();
}

NotificationCenter.prototype.unregister = function(socket, protoNotification) {}

NotificationCenter.prototype.post = function(category, name, args) {
    this.socket.emit(this.protoNotification.Post.RES, { category: category, name: name, args: args });
}
