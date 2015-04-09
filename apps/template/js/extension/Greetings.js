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
var assign       = require('object-assign');
var cbq          = require('framework/diligent/clients/callback-queue');

var GreetingsExtension = assign({}, EventEmitter.prototype, {
    name: 'Greetings',
    version: 0,
    activate: function() {
        var self = this;

        /* Implement Greetings extension response handler */
        this.socket.on(this.wsapi[this.version].Say.Hello.RES, function(msg) {
            cbq.dequeueApiCallback('extension.greetings', 'sayHello', function(apiCallback) {
                apiCallback(msg);
                /**
                 * We will get Say.Hello.ERR for error test after Say.Hello.RES.
                 * Return false to keep callback in cb queue to handle Say.Hello.ERR
                 */
                return false;
            });
        });

        /* Implement Greetings extension error handler */
        this.socket.on(this.wsapi[this.version].Say.Hello.ERR, function(err) {
            cbq.dequeueApiCallback('extension.greetings', 'sayHello', function(apiCallback) {
                apiCallback(null, err);
                return true;
            });
        });
    },

    inactivate: function() {
        this.socket.removeAllListeners(this.wsapi[this.version].Say.Hello.RES);
        this.socket.removeAllListeners(this.wsapi[this.version].Say.Hello.ERR);
    },

    /* Implement Greetings extension command wrapper */
    sayHello: function(from, to, onComplete) {
        cbq.queueApiCallback('extension.greetings', 'sayHello', onComplete);
        this.socket.emit(this.wsapi[this.version].Say.Hello.REQ, from, to);
    }
});

module.exports = GreetingsExtension;
