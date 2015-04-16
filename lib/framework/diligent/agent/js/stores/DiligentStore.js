var DiligentDispatcher = require('../dispatcher/DiligentDispatcher');
var DiligentConstants  = require('../constants/DiligentConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var DiligentClient = null;
var DiligentInfo = {
    client: {
        version: -1,
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
        return DiligentClient;
    },

    /**
     * @return {object} diligent client info
     */
    getClientInfo: function() {
        return DiligentInfo.client;
    },

    /**
     * @return {object} extension info
     */
    getExtensionInfo: function(extensionName) {
        if (DiligentInfo.extension[extensionName])
            return DiligentInfo.extension[extensionName];
        else
            return {
                version: -1,
                status: '',
                error: ''
            };
    },

    emitDiligentChange: function(change) {
        this.emit(change);
    },

    emitExtensionChange: function(arg) {
        this.emit(DiligentConstants.EXTENSION_CHANGE_EVENT, arg);
    },

    addClientWillLaunchListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_INITIATE, callback);
    },

    addClientDidLaunchListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_RUNNING, callback);
    },

    addClientWillStopListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_TERMINATE, callback);
    },

    addClientDidStopListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_STOPPED, callback);
    },

    addExtensionListener: function(callback) {
        this.on(DiligentConstants.EXTENSION_CHANGE_EVENT, callback);
    },

    removeClientWillLaunchListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_INITIATE, callback);
    },

    removeClientDidLaunchListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_RUNNING, callback);
    },

    removeClientWillStopListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_TERMINATE, callback);
    },

    removeClientDidStopListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_STOPPED, callback);
    },

    removeExtensionListener: function(callback) {
        this.removeListener(DiligentConstants.EXTENSION_CHANGE_EVENT, callback);
    }
});

DiligentStore.dispatchToken = DiligentDispatcher.register(function(action) {
    switch(action.actionType) {
        /* Diligent client startup actions */
        case DiligentConstants.DILIGENT_CLIENT_INITIATE:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CLIENT_INITIATE;
            DiligentInfo.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CLIENT_TERMINATE;
            DiligentInfo.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED;
            DiligentInfo.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CONNECTION_CLOSED;
            DiligentInfo.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CONNECT_FAIL:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CONNECT_FAIL;
            DiligentInfo.client.error = action.error;
            break;
        case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS;
            DiligentInfo.client.error = '';
            break;
        case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL;
            DiligentInfo.client.error = action.error;
            break;
        case DiligentConstants.EXTENSION_LOAD:
            DiligentInfo.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_LOAD,
                error: ''
            };
            break;

        /* Diligent client status */
        case DiligentConstants.DILIGENT_CLIENT_RUNNING:
            DiligentClient = action.client;
            DiligentInfo.client.version = DiligentClient.version;
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CLIENT_RUNNING;
            DiligentInfo.client.error = '';
            break;
        case DiligentConstants.DILIGENT_CLIENT_STOPPED:
            DiligentInfo.client.status = DiligentConstants.DILIGENT_CLIENT_STOPPED;
            DiligentInfo.client.error = '';
            break;

        /* Extension actions */
        case DiligentConstants.EXTENSION_UNLOAD:
            DiligentInfo.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_UNLOAD,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_LOAD_SUCCESS:
            DiligentInfo.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_LOAD_SUCCESS,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD_SUCCESS:
            DiligentInfo.extension[action.name] = {
                version: action.version,
                status: DiligentConstants.EXTENSION_UNLOAD_SUCCESS,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_LOAD_FAIL:
            DiligentInfo.extension[action.name] = {
                version: -1,
                status: DiligentConstants.EXTENSION_LOAD_FAIL,
                error: action.error
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD_FAIL:
            DiligentInfo.extension[action.name] = {
                version: -1,
                status: DiligentConstants.EXTENSION_UNLOAD_FAIL,
                error: action.error
            };
            break;
    }

    if (action.actionType.indexOf('DILIGENT') === 0)
        DiligentStore.emitDiligentChange(action.actionType);
    else if (action.actionType.indexOf('EXTENSION') === 0)
        DiligentStore.emitExtensionChange(action.name);
});

module.exports = DiligentStore;
