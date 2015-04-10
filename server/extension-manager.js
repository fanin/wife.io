"use strict";

var SYSTEM = require('../system');

module.exports = ExtensionManager;

function ExtensionManager(_super, wsapi) {
    this._super = _super;
    this.wsapi = wsapi;
    this.extensions = [];
}

ExtensionManager.prototype.register = function(socket, complete) {
    /**
     * Protocol Listener: Extension Management Events
     */
    socket.on(this.wsapi.Load.REQ, function(name, majorVersion) {
        if (!this._super.securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(this.wsapi.Load.ERR, name, SYSTEM.ERROR.ERROR_EXTENSION_NOT_ALLOW);
            return;
        }

        if (this.extensions[name] && this.extensions[name].wsapi) {
            this.extensions[name].userCount++;
            this.extensions[name].activate(socket);
            socket.emit(this.wsapi.Load.RES, name, this.extensions[name].wsapi);
            return;
        }

        try {
            var ExtensionModule = require('./extension/' + name.toLowerCase() + '/' +  name.toLowerCase());
            this.extensions[name] = new ExtensionModule();

            this.extensions[name].wsapi = this._super.loadWSApi('wsapi-ext-spec-' + name.toLowerCase(), majorVersion);
            if (this.extensions[name].wsapi) {
                if (this.extensions[name].userCount === undefined)
                    this.extensions[name].userCount = 1;
                this.extensions[name].activate(socket);
                socket.emit(this.wsapi.Load.RES, name, this.extensions[name].wsapi);
            }
            else {
                console.log('Unable to load extension wsapi spec');
                socket.emit(this.wsapi.Load.ERR, name, this._super.error);
            }
        }
        catch (err) {
            console.log('Unable to load extension module [' + name + ']: ' + err);
            this.extensions[name] = undefined;
            socket.emit(this.wsapi.Load.ERR, name, err);
        }
    }.bind(this));

    socket.on(this.wsapi.Unload.REQ, function(name, majorVersion) {
        if (!this._super.securityManager.isExtensionAllowed(socket, name)) {
            console.log('Extension module [' + name + '] not allowed');
            socket.emit(this.wsapi.Unload.ERR, name, SYSTEM.ERROR.ERROR_EXTENSION_NOT_ALLOW);
            return;
        }

        if (this.extensions[name]) {
            this.extensions[name].inactivate(socket);
            this.extensions[name].userCount--;
            if (this.extensions[name].userCount == 0) {
                this.extensions[name] = undefined;
                socket.emit(this.wsapi.Unload.RES, name, "Unloaded");
            }
            else
                socket.emit(this.wsapi.Unload.RES, name, "InUse");
        }
    }.bind(this));

    complete && complete();
}

ExtensionManager.prototype.unregister = function(socket) {
    socket.removeAllListeners(this.wsapi.Load.REQ);
    socket.removeAllListeners(this.wsapi.Unload.REQ);
}
