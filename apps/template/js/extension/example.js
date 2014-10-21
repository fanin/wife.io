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
ExampleExtensionDelegate.prototype.exampleDidSayHello = function(msg){};
ExampleExtensionDelegate.prototype.exampleDidFailSayHelloWithError = function(err){};

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
};

ExampleExtension.prototype.activate = function() {
    var self = this;

    /* Implement Example extension response handler */
    self.socket.on(self.protocol[0].Say.Hello.RES, function(msg) {
        self.delegate.exampleDidSayHello(msg);
    });

    /* Implement Example extension error handler */
    self.socket.on(self.protocol[0].Say.Hello.ERR, function(err) {
        self.delegate.exampleDidFailSayHelloWithError(err);
    });
}

ExampleExtension.prototype.inactivate = function() {
    this.socket.removeAllListeners(this.protocol[0].Say.Hello.RES);
    this.socket.removeAllListeners(this.protocol[0].Say.Hello.ERR);
}

/* Implement Example extension command wrapper */
ExampleExtension.prototype.sayHello = function(to, from) {
    this.socket.emit(this.protocol[0].Say.Hello.REQ, to, from);
}
