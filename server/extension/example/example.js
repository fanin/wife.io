/* Server side example extension module */
module.exports = ExampleExtension;

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
}

ExampleExtension.prototype.activate = function(socket) {
    var self = this;

    /* Implement Example extension commands */
    socket.on(self.apiSpec[self.version].Say.Hello.REQ, function(to, from) {
        /* Response test */
        socket.emit(self.apiSpec[self.version].Say.Hello.RES, "Hello " + to + ", I'm " + from);

        /* Error test */
        socket.emit(self.apiSpec[self.version].Say.Hello.ERR, "I feel bad, leave me alone!");
    });
}

ExampleExtension.prototype.inactivate = function(socket) {
    socket.removeAllListeners(this.apiSpec[this.version].Say.Hello.REQ);
}
