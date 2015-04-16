var EventEmitter = require('events').EventEmitter;
var assign       = require('object-assign');
var cbq          = require('./callback-queue');

var _extensions = [];

var ExtensionManager = assign({}, EventEmitter.prototype, {
    /**
     * Attach Extension API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        var self = this;

        this.socket = _super.ioClient;
        this.wsapi = _super.wsapi[0].Extension;

        /* Dispatch Extension api response events */
        this.socket.on(this.wsapi.Load.RES, function(name, wsapi) {
            if (wsapi) {
                _extensions[name].wsapi = wsapi;
                _extensions[name].socket = self.socket;
                _extensions[name].activate();
                cbq.dequeueApiCallback('extension.load', name, function(apiCallback) {
                    apiCallback(name, _extensions[name].version);
                    return true;
                });
            }
        });

        this.socket.on(this.wsapi.Unload.RES, function(name, status) {
            if (_extensions[name].wsapi) {
                _extensions[name].inactivate();
                cbq.dequeueApiCallback('extension.unload', name, function(apiCallback) {
                    apiCallback(name, _extensions[name].version);
                    return true;
                });
                _extensions[name] = undefined;
            }
        });

        this.socket.on(this.wsapi.Load.ERR, function(name, error) {
            cbq.dequeueApiCallback('extension.load', name, function(apiCallback) {
                apiCallback(name, -1, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Unload.ERR, function(name, error) {
            cbq.dequeueApiCallback('extension.unload', name, function(apiCallback) {
                apiCallback(name, -1, error);
                return true;
            });
        });
    },

    /**
     * Detach Extension API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.wsapi.Load.RES);
        this.socket.removeAllListeners(this.wsapi.Load.ERR);
        this.socket.removeAllListeners(this.wsapi.Unload.RES);
        this.socket.removeAllListeners(this.wsapi.Unload.ERR);

        this.socket = undefined;
        this.wsapi = undefined;

        _extensions = [];
    },

    /**
     * Load extension
     * @param {object} extension object
     */
    load: function(extension, onComplete) {
        _extensions[extension.name] = extension;
        cbq.queueApiCallback('extension.load', extension.name, onComplete);
        this.socket.emit(this.wsapi.Load.REQ, extension.name, extension.version);
    },

    /**
     * Unload extension
     * @param {object} extension object
     */
    unload: function(extension, onComplete) {
        cbq.queueApiCallback('extension.unload', extension.name, onComplete);
        this.socket.emit(this.wsapi.Unload.REQ, extension.name, extension.version);
    }
});

module.exports = ExtensionManager;
