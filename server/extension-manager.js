var SYSTEM = require('../system');

module.exports = ExtensionManager;

function ExtensionManager() {
    this.extensions = new Array();
}

ExtensionManager.prototype.register = function(_super, socket, protoExtension, complete) {
    var self = this;
    var securityManager = _super.securityManager;

    /**
     * Protocol Listener: Extension Management Events
     */
    socket.on(protoExtension.Load.REQ, function(name, majorVersion) {
        if (!securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(protoExtension.Load.ERR, name, SYSTEM.ERROR.ExtensionNotAllow);
            return;
        }

        if (self.extensions[name] && self.extensions[name].protocol) {
            self.extensions[name].user++;
            self.extensions[name].activate(socket);
            socket.emit(protoExtension.Load.RES, name, self.extensions[name].protocol);
            return;
        }

        try {
            var ExtensionModule = require('./extension/' + name.toLowerCase() + '/' +  name.toLowerCase());
            self.extensions[name] = new ExtensionModule();

            self.extensions[name].protocol = _super.loadProtoSpec('ProtoSpecExt-' + name, majorVersion);
            if (self.extensions[name].protocol) {
                if (self.extensions[name].user === undefined)
                    self.extensions[name].user = 1;
                self.extensions[name].activate(socket);
                socket.emit(protoExtension.Load.RES, name, self.extensions[name].protocol);
            }
            else {
                console.log('Unable to load extension protocol spec');
                socket.emit(protoExtension.Load.ERR, name, _super.error);
            }
        }
        catch (err) {
            console.log('Unable to load extension module [' + name + ']: ' + err);
            self.extensions[name] = undefined;
            socket.emit(protoExtension.Load.ERR, name, SYSTEM.ERROR.ExtensionLoad);
        }
    });

    socket.on(protoExtension.Unload.REQ, function(name, majorVersion) {
        if (!securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(protoExtension.Unload.ERR, name, SYSTEM.ERROR.ExtensionNotAllow);
            return;
        }

        if (self.extensions[name]) {
            self.extensions[name].inactivate(socket);
            self.extensions[name].user--;
            if (self.extensions[name].user == 0) {
                self.extensions[name] = undefined;
                socket.emit(protoExtension.Unload.RES, name, "Unloaded");
            }
            else
                socket.emit(protoExtension.Unload.RES, name, "InUse");
        }
    });

    complete && complete();
}

ExtensionManager.prototype.unregister = function(socket, protoExtension) {
    socket.removeAllListeners(protoExtension.Load.REQ);
    socket.removeAllListeners(protoExtension.Unload.REQ);
}
