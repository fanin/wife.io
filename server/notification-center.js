"use strict";

module.exports = NotificationCenter;

function NotificationCenter(_super, wsapi) {
    this._super = _super;
    this.wsapi = wsapi;
    this.sockets = [];
}

NotificationCenter.prototype.register = function(socket, complete) {
    this.sockets.push(socket);
    complete && complete();
}

NotificationCenter.prototype.unregister = function(socket) {
    for (var i in this.sockets)
        if (this.sockets[i] === socket)
            this.sockets.splice(i, 1);
}

NotificationCenter.prototype.post = function(category, name, args) {
    for (var i in this.sockets)
        this.sockets[i].emit(this.wsapi.Post.RES, { category: category, name: name, args: args });
}
