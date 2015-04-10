"use strict";

/* Server side greetings extension module */
module.exports = GreetingsExtension;

function GreetingsExtension() {
    this.name = "Greetings";
    this.version = 0;
}

GreetingsExtension.prototype.activate = function(socket) {
    /* Implement greetings extension commands */
    socket.on(this.wsapi[this.version].Say.Hello.REQ, function(from, to) {
        /* Response test */
        socket.emit(this.wsapi[this.version].Say.Hello.RES, "Hello " + to + ", I'm " + from);

        /* Error test */
        socket.emit(this.wsapi[this.version].Say.Hello.ERR, "I feel bad, leave me alone!");
    }.bind(this));
}

GreetingsExtension.prototype.inactivate = function(socket) {
    socket.removeAllListeners(this.wsapi[this.version].Say.Hello.REQ);
}
