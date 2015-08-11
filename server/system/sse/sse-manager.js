"use strict";

function SSEManager() {
    this.events = [];
}

SSEManager.prototype.register = function(sseURL, events) {
    this.events[sseURL] = events;
}

SSEManager.prototype.unregister = function(sseURL) {
    this.events[sseURL] = undefined;
}

SSEManager.prototype.broadcast = function(sseURL, message) {
    if (this.events[sseURL] && message)
        this.events[sseURL].broadcast(message);
}

var singleton = function() {
    if (singleton.caller != singleton.getInstance) {
        throw new Error("This object cannot be instanciated");
    }
}

singleton.instance = null;

singleton.getInstance = function() {
    if(this.instance === null) {
        this.instance = new SSEManager();
    }
    return this.instance;
}

module.exports = singleton.getInstance();
