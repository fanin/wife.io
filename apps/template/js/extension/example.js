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
    self.socket.on(self.protocol.Response[self.version].Say.Hello, function(msg) {
        self.delegate && self.delegate.protoResponseSayHello(self, msg);
    });

    /* Implement Example extension error handler */
    self.socket.on(self.protocol.Error[self.version].Say.Hello, function(err) {
        self.delegate && self.delegate.protoErrorSayHello(self, err);
    });
}

ExampleExtension.prototype.inactivate = function() {
    this.socket.removeAllListeners(this.protocol.Response[this.version].Say.Hello);
    this.socket.removeAllListeners(this.protocol.Error[this.version].Say.Hello);
}

/* Implement Example extension command wrapper */
ExampleExtension.prototype.sayHello = function() {
    this.socket.emit(this.protocol.Command[this.version].Say.Hello);
}
