var AppDispatcher = require('../dispatcher/AppDispatcher');
var DiligentConstants = require('../constants/DiligentConstants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var DILIGENT_CHANGE_EVENT = 'DILIGENT_CHANGE';
var EXTENSION_CHANGE_EVENT = 'EXTENSION_CHANGE';

var diligent = {
    client: {
        version: DiligentClient.version,
        status: '',
        connectionStatus: '',
        wsapiStatus: ''
    },
    extension: []
};

var DiligentStore = assign({}, EventEmitter.prototype, {
    /**
     * @return {integer} version number
     */
    getClientVersion: function() {
        return diligent.client.version;
    },

    /**
     * @return {string} client status
     */
    getClientStatus: function() {
        return diligent.client.status;
    },

    /**
     * @return {string} connection status
     */
    getConnectionStatus: function() {
        return diligent.client.connectionStatus;
    },

    /**
     * @return {string} WSAPI status
     */
    getWSApiStatus: function() {
        return diligent.client.wsapiStatus;
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
        this.emit(DILIGENT_CHANGE_EVENT);
    },

    /**
     * Emit extension changes
     */
    emitExtensionChange: function(arg) {
        this.emit(EXTENSION_CHANGE_EVENT, arg);
    },

    /**
     * @param {function} callback
     */
    addDiligentListener: function(callback) {
        this.on(DILIGENT_CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    addExtensionListener: function(callback) {
        this.on(EXTENSION_CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeDiligentListener: function(callback) {
        this.removeListener(DILIGENT_CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeExtensionListener: function(callback) {
        this.removeListener(EXTENSION_CHANGE_EVENT, callback);
    }
});

AppDispatcher.register(function(action) {
    switch(action.actionType) {
        case DiligentConstants.DILIGENT_CLIENT_INITIATE:
            diligent.client.status = 'INITIATING';
            break;
        case DiligentConstants.DILIGENT_CLIENT_RUNNING:
            diligent.client.status = 'RUNNING';
            break;
        case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
            diligent.client.status = 'TERMINATING';
            break;
        case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
            diligent.client.connectionStatus = 'ESTABLISHED';
            break;
        case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
            diligent.client.connectionStatus = 'CLOSED';
            break;
        case DiligentConstants.DILIGENT_CONNECT_FAIL:
            diligent.client.connectionStatus = action.error;
            break;
        case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
            diligent.client.wsapiStatus = 'LOADED';
            break;
        case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
            diligent.client.wsapiStatus = action.error;
            break;
        case DiligentConstants.EXTENSION_LOAD:
            diligent.extension[action.name] = {
                status: 'LOAD',
                version: action.version,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD:
            diligent.extension[action.name] = {
                status: 'UNLOAD',
                version: action.version,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_LOAD_SUCCESS:
            diligent.extension[action.name] = {
                status: 'LOADED',
                version: action.version,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD_SUCCESS:
            diligent.extension[action.name] = {
                status: 'UNLOADED',
                version: action.version,
                error: ''
            };
            break;
        case DiligentConstants.EXTENSION_LOAD_FAIL:
            diligent.extensionInfo[action.name] = {
                status: 'ERROR',
                version: -1,
                error: action.error
            };
            break;
        case DiligentConstants.EXTENSION_UNLOAD_FAIL:
            diligent.extension[action.name] = {
                status: 'ERROR',
                version: -1,
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
