/**
 * Client side example extension module
 * A typical extension client module consists of:
 *   1) Extension main module
 *      - to provide command protocol wrapper for APP
 *      - to handle response & error protocol
 *   2) Extension module delegate
 *      - to define extension APIs to be implemented in APP
 */

function ExampleExtensionDelegate() {};
ExampleExtensionDelegate.prototype.constructor = ExampleExtensionDelegate;
ExampleExtensionDelegate.prototype.protoResponseSayHello = function(example, msg){};
ExampleExtensionDelegate.prototype.protoErrorSayHello = function(example, err){};

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
};

ExampleExtension.prototype.activate = function() {
    var self = this;

    /* Implement Example extension response handler */
    self.socket.on(self.protocol.MinorVersion[self.version].Say.Hello.Return.Hello, function(msg) {
        self.delegate && self.delegate.protoResponseSayHello(self, msg);
    });

    /* Implement Example extension error handler */
    self.socket.on(self.protocol.MinorVersion[self.version].Say.Hello.Error, function(err) {
        self.delegate && self.delegate.protoErrorSayHello(self, err);
    });
}

ExampleExtension.prototype.inactivate = function() {
    this.socket.removeAllListeners(this.protocol.MinorVersion[this.version].Say.Hello.Return.Hello);
    this.socket.removeAllListeners(this.protocol.MinorVersion[this.version].Say.Hello.Error);
}

/* Implement Example extension command wrapper */
ExampleExtension.prototype.sayHello = function(to, from) {
    this.socket.emit(this.protocol.MinorVersion[this.version].Say.Hello.Command, to, from);
}
