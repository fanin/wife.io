"use strict";

var SYSTEM = require('../system');

module.exports = ExtensionManager;

function ExtensionManager(_super, apiSpec) {
    this._super = _super;
    this.APISpec = apiSpec;
    this.extensions = [];
}

ExtensionManager.prototype.register = function(socket, complete) {
    /**
     * Protocol Listener: Extension Management Events
     */
    socket.on(this.APISpec.Load.REQ, function(name, majorVersion) {
        if (!this._super.securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(this.APISpec.Load.ERR, name, SYSTEM.ERROR.ERROR_EXTENSION_NOT_ALLOW);
            return;
        }

        if (this.extensions[name] && this.extensions[name].apiSpec) {
            this.extensions[name].userCount++;
            this.extensions[name].activate(socket);
            socket.emit(this.APISpec.Load.RES, name, this.extensions[name].apiSpec);
            return;
        }

        try {
            var ExtensionModule = require('./extension/' + name.toLowerCase() + '/' +  name.toLowerCase());
            this.extensions[name] = new ExtensionModule();

            this.extensions[name].apiSpec = this._super.loadWSAPISpec('wsapi-ext-spec-' + name.toLowerCase(), majorVersion);
            if (this.extensions[name].apiSpec) {
                if (this.extensions[name].userCount === undefined)
                    this.extensions[name].userCount = 1;
                this.extensions[name].activate(socket);
                socket.emit(this.APISpec.Load.RES, name, this.extensions[name].apiSpec);
            }
            else {
                console.log('Unable to load extension api spec');
                socket.emit(this.APISpec.Load.ERR, name, this._super.error);
            }
        }
        catch (err) {
            console.log('Unable to load extension module [' + name + ']: ' + err);
            this.extensions[name] = undefined;
            socket.emit(this.APISpec.Load.ERR, name, err);
        }
    }.bind(this));

    socket.on(this.APISpec.Unload.REQ, function(name, majorVersion) {
        if (!this._super.securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(this.APISpec.Unload.ERR, name, SYSTEM.ERROR.ERROR_EXTENSION_NOT_ALLOW);
            return;
        }

        if (this.extensions[name]) {
            this.extensions[name].inactivate(socket);
            this.extensions[name].userCount--;
            if (this.extensions[name].userCount == 0) {
                this.extensions[name] = undefined;
                socket.emit(this.APISpec.Unload.RES, name, "Unloaded");
            }
            else
                socket.emit(this.APISpec.Unload.RES, name, "InUse");
        }
    }.bind(this));

    complete && complete();
}

ExtensionManager.prototype.unregister = function(socket) {
    socket.removeAllListeners(this.APISpec.Load.REQ);
    socket.removeAllListeners(this.APISpec.Unload.REQ);
}
