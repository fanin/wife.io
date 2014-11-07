function ExtensionClient() {
    this.extensions = new Array();
}

extend(ExtensionClient.prototype, Event.prototype);

ExtensionClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.protoExtension = _super.protocol[0].Extension;

    /* Dispatch Extension protocol response events */
    this.socket.on(this.protoExtension.Load.RES, function(name, proto) {
        if (proto) {
            self.extensions[name].protocol = proto;
            self.extensions[name].socket = self.socket;
            self.extensions[name].activate();
            self.event.trigger('extension.load#success', name);
        }
    });

    this.socket.on(this.protoExtension.Unload.RES, function(name, status) {
        if (self.extensions[name].protocol) {
            self.extensions[name].inactivate();
            self.extensions[name].protocol = undefined;
            self.event.trigger('extension.unload#success', name);
        }
    });

    this.socket.on(this.protoExtension.Load.ERR, function(name, error) {
        self.event.trigger('extension.load#error', name, error);
    });

    this.socket.on(this.protoExtension.Unload.ERR, function(name, error) {
        self.event.trigger('extension.unload#error', name, error);
    });
}

ExtensionClient.prototype.detach = function() {
    /* Remove Extension protocol response events */
    this.socket.removeAllListeners(this.protoExtension.Load.RES);
    this.socket.removeAllListeners(this.protoExtension.Load.ERR);
    this.socket.removeAllListeners(this.protoExtension.Unload.RES);
    this.socket.removeAllListeners(this.protoExtension.Unload.ERR);

    this.socket = undefined;
    this.protoExtension = undefined;
}

/* Extension client APIs */
ExtensionClient.prototype.load = function(extension) {
    this.extensions[extension.name] = extension;
    this.socket.emit(this.protoExtension.Load.REQ, extension.name, extension.version);
}

ExtensionClient.prototype.unload = function(extension) {
    this.socket.emit(this.protoExtension.Unload.REQ, extension.name, extension.version);
}
