/**
 * Client side greetings extension module
 * A typical extension client module consists of:
 *   1) Extension main module
 *      - to provide command API wrapper for APP
 *      - to handle response & error API
 *   2) Extension module events
 *      - to define extension events to be implemented in APP
 */

var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var GreetingsExtension = assign({}, EventEmitter.prototype, {
    name: "Greetings",
    version: 0,
    activate: function() {
        var self = this;

        /* Implement Greetings extension response handler */
        this.socket.on(this.apiSpec[0].Say.Hello.RES, function(msg) {
            self.emit("greetings.sayhello#success", msg);
        });

        /* Implement Greetings extension error handler */
        this.socket.on(this.apiSpec[0].Say.Hello.ERR, function(err) {
            self.emit("greetings.sayhello#error", err);
        });
    },

    inactivate: function() {
        this.socket.removeAllListeners(this.apiSpec[0].Say.Hello.RES);
        this.socket.removeAllListeners(this.apiSpec[0].Say.Hello.ERR);
    },

    /* Implement Greetings extension command wrapper */
    sayHello: function(from, to) {
        this.socket.emit(this.apiSpec[0].Say.Hello.REQ, from, to);
    }
});

module.exports = GreetingsExtension;
