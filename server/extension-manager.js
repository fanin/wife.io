var SYSTEM = require('../system');

module.exports = ExtensionManager;

function ExtensionManager(_super, apiSpec) {
    this._super = _super;
    this.APISpec = apiSpec;
    this.extensions = [];
}

ExtensionManager.prototype.register = function(socket, complete) {
    var self = this;

    /**
     * Protocol Listener: Extension Management Events
     */
    socket.on(self.APISpec.Load.REQ, function(name, majorVersion) {
        if (!self._super.securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(self.APISpec.Load.ERR, name, SYSTEM.ERROR.ExtensionNotAllow);
            return;
        }

        if (self.extensions[name] && self.extensions[name].apiSpec) {
            self.extensions[name].user++;
            self.extensions[name].activate(socket);
            socket.emit(self.APISpec.Load.RES, name, self.extensions[name].apiSpec);
            return;
        }

        try {
            var ExtensionModule = require('./extension/' + name.toLowerCase() + '/' +  name.toLowerCase());
            self.extensions[name] = new ExtensionModule();

            self.extensions[name].apiSpec = self._super.loadAPISpec('wsapi-ext-spec-' + name.toLowerCase(), majorVersion);
            if (self.extensions[name].apiSpec) {
                if (self.extensions[name].user === undefined)
                    self.extensions[name].user = 1;
                self.extensions[name].activate(socket);
                socket.emit(self.APISpec.Load.RES, name, self.extensions[name].apiSpec);
            }
            else {
                console.log('Unable to load extension api spec');
                socket.emit(self.APISpec.Load.ERR, name, self._super.error);
            }
        }
        catch (err) {
            console.log('Unable to load extension module [' + name + ']: ' + err);
            self.extensions[name] = undefined;
            socket.emit(self.APISpec.Load.ERR, name, SYSTEM.ERROR.ExtensionLoad);
        }
    });

    socket.on(self.APISpec.Unload.REQ, function(name, majorVersion) {
        if (!self._super.securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(self.APISpec.Unload.ERR, name, SYSTEM.ERROR.ExtensionNotAllow);
            return;
        }

        if (self.extensions[name]) {
            self.extensions[name].inactivate(socket);
            self.extensions[name].user--;
            if (self.extensions[name].user == 0) {
                self.extensions[name] = undefined;
                socket.emit(self.APISpec.Unload.RES, name, "Unloaded");
            }
            else
                socket.emit(self.APISpec.Unload.RES, name, "InUse");
        }
    });

    complete && complete();
}

ExtensionManager.prototype.unregister = function(socket) {
    socket.removeAllListeners(this.APISpec.Load.REQ);
    socket.removeAllListeners(this.APISpec.Unload.REQ);
}
