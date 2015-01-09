function ExtensionClient() {
    this.extensions = new Array();
}

extend(ExtensionClient.prototype, Event.prototype);

ExtensionClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.APISpec = _super.apiSpec[0].Extension;

    /* Dispatch Extension api response events */
    this.socket.on(this.APISpec.Load.RES, function(name, apiSpec) {
        if (apiSpec) {
            self.extensions[name].apiSpec = apiSpec;
            self.extensions[name].socket = self.socket;
            self.extensions[name].activate();
            self.event.trigger('extension.load#success', name);
        }
    });

    this.socket.on(this.APISpec.Unload.RES, function(name, status) {
        if (self.extensions[name].apiSpec) {
            self.extensions[name].inactivate();
            self.extensions[name].apiSpec = undefined;
            self.event.trigger('extension.unload#success', name);
        }
    });

    this.socket.on(this.APISpec.Load.ERR, function(name, error) {
        self.event.trigger('extension.load#error', [ name, error ]);
    });

    this.socket.on(this.APISpec.Unload.ERR, function(name, error) {
        self.event.trigger('extension.unload#error', [ name, error ]);
    });
}

ExtensionClient.prototype.detach = function() {
    /* Remove Extension APISpec response events */
    this.socket.removeAllListeners(this.APISpec.Load.RES);
    this.socket.removeAllListeners(this.APISpec.Load.ERR);
    this.socket.removeAllListeners(this.APISpec.Unload.RES);
    this.socket.removeAllListeners(this.APISpec.Unload.ERR);

    this.socket = undefined;
    this.APISpec = undefined;
}

/* Extension client APIs */
ExtensionClient.prototype.load = function(extension) {
    this.extensions[extension.name] = extension;
    this.socket.emit(this.APISpec.Load.REQ, extension.name, extension.version);
}

ExtensionClient.prototype.unload = function(extension) {
    this.socket.emit(this.APISpec.Unload.REQ, extension.name, extension.version);
}
