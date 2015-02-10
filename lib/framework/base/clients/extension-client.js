var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var _extensions = [];

var ExtensionClient = assign({}, EventEmitter.prototype, {
    /**
     * Attach Extension API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        var self = this;

        this.socket = _super.ioClient;
        this.APISpec = _super.apiSpec[0].Extension;

        /* Dispatch Extension api response events */
        this.socket.on(this.APISpec.Load.RES, function(name, apiSpec) {
            if (apiSpec) {
                _extensions[name].apiSpec = apiSpec;
                _extensions[name].socket = self.socket;
                _extensions[name].activate();
                self.emit('extension.load#success', { name: name, version: _extensions[name].version });
            }
        });

        this.socket.on(this.APISpec.Unload.RES, function(name, status) {
            if (_extensions[name].apiSpec) {
                _extensions[name].inactivate();
                self.emit('extension.unload#success', { name: name, version: _extensions[name].version });
                _extensions[name] = undefined;
            }
        });

        this.socket.on(this.APISpec.Load.ERR, function(name, error) {
            self.emit('extension.load#error', { name: name, error: error });
        });

        this.socket.on(this.APISpec.Unload.ERR, function(name, error) {
            self.emit('extension.unload#error', { name: name, error: error });
        });
    },

    /**
     * Detach Extension API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.APISpec.Load.RES);
        this.socket.removeAllListeners(this.APISpec.Load.ERR);
        this.socket.removeAllListeners(this.APISpec.Unload.RES);
        this.socket.removeAllListeners(this.APISpec.Unload.ERR);

        this.socket = undefined;
        this.APISpec = undefined;

        _extensions = [];
    },

    /**
     * Load extension
     * @param {object} extension object
     */
    load: function(extension) {
        _extensions[extension.name] = extension;
        this.socket.emit(this.APISpec.Load.REQ, extension.name, extension.version);
    },

    /**
     * Unload extension
     * @param {object} extension object
     */
    unload: function(extension) {
        this.socket.emit(this.APISpec.Unload.REQ, extension.name, extension.version);
    }
});

module.exports = ExtensionClient;
