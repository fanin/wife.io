/* Server side example extension module */
module.exports = ExampleExtension;

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
}

ExampleExtension.prototype.activate = function() {
    var self = this;

    /* Implement Example extension commands */
    self.socket.on(self.protocol.Command[self.version].Say.Hello, function() {
        /* Response test */
        self.socket.emit(self.protocol.Response[self.version].Say.Hello, "Hello, I'm Mr. " + self.name);

        /* Error test */
        self.socket.emit(self.protocol.Error[self.version].Say.Hello, "I feel bad, leave me alone!");
    });
}

ExampleExtension.prototype.inactivate = function() {
    this.socket.removeAllListeners(this.protocol.Command[this.version].Say.Hello);
}
