/* Server side example extension module */
module.exports = ExampleExtension;

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
}

ExampleExtension.prototype.activate = function() {
    var self = this;

    /* Implement Example extension commands */
    self.socket.on(self.protocol.MinorVersion[self.version].Say.Hello.Command, function(to, from) {
        /* Response test */
        self.socket.emit(self.protocol.MinorVersion[self.version].Say.Hello.Return.Hello, "Hello " + to + ", I'm " + from);

        /* Error test */
        self.socket.emit(self.protocol.MinorVersion[self.version].Say.Hello.Error, "I feel bad, leave me alone!");
    });
}

ExampleExtension.prototype.inactivate = function() {
    this.socket.removeAllListeners(this.protocol.MinorVersion[this.version].Say.Hello.Command);
}
