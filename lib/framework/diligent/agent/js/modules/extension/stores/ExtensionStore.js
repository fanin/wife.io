var ExtensionDispatcher = require("../dispatcher/ExtensionDispatcher");
var ExtensionConstants  = require("../constants/ExtensionConstants");
var EventEmitter        = require("events").EventEmitter;
var assign              = require("object-assign");

var extensions = [];

var ExtensionStore = assign({}, EventEmitter.prototype, {
    /**
     * @return {object} extension info
     */
    getExtensionInfo: function(extensionName) {
        if (extensions[extensionName])
            return extensions[extensionName];
        else
            return {
                version: -1,
                status: "",
                error: ""
            };
    },

    emitExtensionChange: function(arg) {
        this.emit(ExtensionConstants.EXTENSION_CHANGE_EVENT, arg);
    },

    addChangeListener: function(callback) {
        this.on(ExtensionConstants.EXTENSION_CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(ExtensionConstants.EXTENSION_CHANGE_EVENT, callback);
    }
});

ExtensionStore.dispatchToken = ExtensionDispatcher.register(function(action) {
    switch(action.actionType) {
        case ExtensionConstants.EXTENSION_LOAD:
            extensions[action.name] = {
                version: action.version,
                status: "Loading",
                error: ""
            };
            break;
        case ExtensionConstants.EXTENSION_UNLOAD:
            extensions[action.name] = {
                version: action.version,
                status: "Unloading",
                error: ""
            };
            break;
        case ExtensionConstants.EXTENSION_LOAD_SUCCESS:
            extensions[action.name] = {
                version: action.version,
                status: "Loaded",
                error: ""
            };
            break;
        case ExtensionConstants.EXTENSION_UNLOAD_SUCCESS:
            extensions[action.name] = {
                version: action.version,
                status: "Unloaded",
                error: ""
            };
            break;
        case ExtensionConstants.EXTENSION_LOAD_FAIL:
            extensions[action.name] = {
                version: -1,
                status: "Load Failed",
                error: action.error
            };
            break;
        case ExtensionConstants.EXTENSION_UNLOAD_FAIL:
            extensions[action.name] = {
                version: -1,
                status: "Unload Failed",
                error: action.error
            };
            break;
    }

    ExtensionStore.emitExtensionChange({ actionType: action.actionType, name: action.name });
});

module.exports = ExtensionStore;
