"use strict";

/* Server side greetings extension module */
module.exports = LauncherExtension;

function LauncherExtension() {
    this.name = "Launcher";
    this.version = 0;
}

LauncherExtension.prototype.activate = function(socket) {
    /* Implement greetings extension commands */
    socket.on(this.apiSpec[this.version].Say.Hello.REQ, function(from, to) {
        /* Response test */
        socket.emit(this.apiSpec[this.version].Say.Hello.RES, "Hello " + to + ", I'm " + from);

        /* Error test */
        socket.emit(this.apiSpec[this.version].Say.Hello.ERR, "I feel bad, leave me alone!");
    }.bind(this));
}

LauncherExtension.prototype.inactivate = function(socket) {
    socket.removeAllListeners(this.apiSpec[this.version].Say.Hello.REQ);
}
