/**
 * Client side example extension module
 * A typical extension client module consists of:
 *   1) Extension main module
 *      - to provide command API wrapper for APP
 *      - to handle response & error API
 *   2) Extension module events
 *      - to define extension events to be implemented in APP
 */

function ExampleExtension() {
    this.name = "Example";
    this.version = 0;
};

extend(ExampleExtension.prototype, Event.prototype);

ExampleExtension.prototype.activate = function() {
    var self = this;

    /* Implement Example extension response handler */
    self.socket.on(self.apiSpec[0].Say.Hello.RES, function(msg) {
        self.event.trigger("example.sayhello#success", msg);
    });

    /* Implement Example extension error handler */
    self.socket.on(self.apiSpec[0].Say.Hello.ERR, function(err) {
        self.event.trigger("example.sayhello#error", err);
    });
}

ExampleExtension.prototype.inactivate = function() {
    this.socket.removeAllListeners(this.apiSpec[0].Say.Hello.RES);
    this.socket.removeAllListeners(this.apiSpec[0].Say.Hello.ERR);
}

/* Implement Example extension command wrapper */
ExampleExtension.prototype.sayHello = function(to, from) {
    this.socket.emit(this.apiSpec[0].Say.Hello.REQ, to, from);
}
