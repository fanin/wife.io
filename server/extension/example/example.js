/* Server side example extension module */
module.exports = ExampleExtension;

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
}

ExampleExtension.prototype.activate = function(socket) {
    /* Implement Example extension commands */
    socket.on(this.apiSpec[this.version].Say.Hello.REQ, function(to, from) {
        /* Response test */
        socket.emit(this.apiSpec[this.version].Say.Hello.RES, "Hello " + to + ", I'm " + from);

        /* Error test */
        socket.emit(this.apiSpec[this.version].Say.Hello.ERR, "I feel bad, leave me alone!");
    }.bind(this));
}

ExampleExtension.prototype.inactivate = function(socket) {
    socket.removeAllListeners(this.apiSpec[this.version].Say.Hello.REQ);
}
