var DiligentDispatcher = require('../dispatcher/DiligentDispatcher');
var DiligentConstants  = require('../constants/DiligentConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var diligent = {
    client: {
        version: DiligentClient.version,
        status: '',
        error: ''
    },
    extension: []
};

var DiligentStore = assign({}, EventEmitter.prototype, {
    /**
     * @return {object} diligent client
     */
    getClient: function() {
        return diligent.client;
    },

    /**
     * @return {object} extension information
     */
    getExtension: function(extensionName) {
        if (diligent.extension[extensionName])
            return diligent.extension[extensionName];
        else
            return {
                status: '',
                version: -1,
                error: ''
            };
    },

    /**
     * Emit diligent client changes
     */
    emitDiligentChange: function() {
        this.emit(DiligentConstants.DILIGENT_CHANGE_EVENT);
    },

    /**
     * Emit extension changes
     */
    emitExtensionChange: function(arg) {
        this.emit(DiligentConstants.EXTENSION_CHANGE_EVENT, arg);
    },

    /**
     * @param {function} callback
     */
    addDiligentListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    addExtensionListener: function(callback) {
        this.on(DiligentConstants.EXTENSION_CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeDiligentListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeExtensionListener: function(callback) {
        this.removeListener(DiligentConstants.EXTENSION_CHANGE_EVENT, callback);
    }
});

DiligentStore.dispatchToken = DiligentDispatcher.register(function(action) {
    switch(action.actionType) {
        case DiligentConstants.DILIGENT_CLIENT_INITIATE:
            diligent.client.status = DiligentConstants.DILIGENT_CLIENT_INITIATE;
            diligent.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CLIENT_RUNNING:
            diligent.client.status = DiligentConstants.DILIGENT_CLIENT_RUNNING;
            diligent.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
            diligent.client.status = DiligentConstants.DILIGENT_CLIENT_TERMINATE;
            diligent.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
            diligent.client.status = DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED;
            diligent.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
            diligent.client.status = DiligentConstants.DILIGENT_CONNECTION_CLOSED;
            diligent.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CONNECT_FAIL:
            diligent.client.status = DiligentConstants.DILIGENT_CONNECT_FAIL;
            diligent.client.error = action.error;
            break;
        case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
            diligent.client.status = DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS;
            diligent.client.error = '';
            break;
        case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
            diligent.client.status = DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL;
            diligent.client.error = action.error;
            break;
        case DiligentConstants.EXTENSION_LOAD:
            diligent.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_LOAD,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD:
            diligent.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_UNLOAD,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_LOAD_SUCCESS:
            diligent.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_LOAD_SUCCESS,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD_SUCCESS:
            diligent.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_UNLOAD_SUCCESS,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_LOAD_FAIL:
            diligent.extension[action.name] = {
                version: -1,
                status: DiligentConstants.EXTENSION_LOAD_FAIL,
                error: action.error
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD_FAIL:
            diligent.extension[action.name] = {
                version: -1,
                status: DiligentConstants.EXTENSION_UNLOAD_FAIL,
                error: action.error
            };
            break;
    }

    if (action.actionType.indexOf('DILIGENT') === 0)
        DiligentStore.emitDiligentChange();
    else if (action.actionType.indexOf('EXTENSION') === 0)
        DiligentStore.emitExtensionChange(action.name);
});

module.exports = DiligentStore;
