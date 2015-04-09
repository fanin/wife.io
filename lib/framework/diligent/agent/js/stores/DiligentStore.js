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

    /**
     * Emit diligent client ready event
     */
    emitDiligentClientReady: function() {
        this.emit(DiligentConstants.DILIGENT_CLIENT_RUNNING);
    },

    /**
     * Emit diligent client stop event
     */
    emitDiligentClientStop: function() {
        this.emit(DiligentConstants.DILIGENT_CLIENT_STOPPED);
    },

    /**
     * Emit diligent client changes
     */
    emitDiligentClientInitEvent: function() {
        this.emit(DiligentConstants.DILIGENT_CLIENT_INIT);
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
    addDiligentClientInitListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_INIT, callback);
    },

    /**
     * @param {function) callback
     */
    addDiligentClientReadyListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_RUNNING, callback);
    },

    /**
     * @param {function) callback
     */
    addDiligentClientStopListener: function(callback) {
        this.on(DiligentConstants.DILIGENT_CLIENT_STOPPED, callback);
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
    removeDiligentClientReadyListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_RUNNING, callback);
    },

    /**
     * @param {function} callback
     */
    removeDiligentClientStopListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_STOPPED, callback);
    },

    /**
     * @param {function} callback
     */
    removeDiligentClientInitListener: function(callback) {
        this.removeListener(DiligentConstants.DILIGENT_CLIENT_INIT, callback);
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

    if (action.actionType === DiligentConstants.DILIGENT_CLIENT_RUNNING)
        DiligentStore.emitDiligentClientReady();
    else if (action.actionType === DiligentConstants.DILIGENT_CLIENT_STOPPED)
        DiligentStore.emitDiligentClientStop();
    else if (action.actionType.indexOf('DILIGENT') === 0)
        DiligentStore.emitDiligentClientInitEvent();
    else if (action.actionType.indexOf('EXTENSION') === 0)
        DiligentStore.emitExtensionChange(action.name);
});

module.exports = DiligentStore;
