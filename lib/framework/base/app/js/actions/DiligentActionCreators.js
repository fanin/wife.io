var DiligentDispatcher = require('../dispatcher/DiligentDispatcher');
var DiligentConstants = require('../constants/DiligentConstants');

function onDiligentConnect() {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED
    });
}

function onDiligentDisconnect() {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_CONNECTION_CLOSED
    });
}

function onDiligentConnectFail(error) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_CONNECT_FAIL,
        error: error
    });
}

function onDiligentWSApiLoad() {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS
    });

    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_CLIENT_RUNNING
    });
}

function onDiligentWSApiLoadFail(error) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL,
        error: error
    });
}

function onExtensionLoad(arg) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.EXTENSION_LOAD_SUCCESS,
        name: arg.name,
        version: arg.version
    });
}

function onExtensionUnload(arg) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.EXTENSION_UNLOAD_SUCCESS,
        name: arg.name,
        version: arg.version
    });
}

function onExtensionLoadFail(arg) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.EXTENSION_LOAD_FAIL,
        name: arg.name,
        error: arg.error
    });
}

function onExtensionUnloadFail(arg) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.EXTENSION_UNLOAD_FAIL,
        name: arg.name,
        error: arg.error
    });
}

module.exports = {
    initiateDiligentClient: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_INITIATE
        });

        DiligentClient.on("diligent.connection#established", onDiligentConnect);
        DiligentClient.on("diligent.connection#closed", onDiligentDisconnect);
        DiligentClient.on("diligent.connection#error", onDiligentConnectFail);
        DiligentClient.on("diligent.wsapi#loaded", onDiligentWSApiLoad);
        DiligentClient.on("diligent.wsapi#error", onDiligentWSApiLoadFail);

        ExtensionClient.on("extension.load#success", onExtensionLoad);
        ExtensionClient.on("extension.unload#success", onExtensionUnload);
        ExtensionClient.on("extension.load#error", onExtensionLoadFail);
        ExtensionClient.on("extension.unload#error", onExtensionUnloadFail);

        DiligentClient.initiate();
    },

    terminateDiligentClient: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_TERMINATE
        });

        DiligentClient.removeAllListeners("diligent.connection#established");
        DiligentClient.removeAllListeners("diligent.connection#closed");
        DiligentClient.removeAllListeners("diligent.connection#error");
        DiligentClient.removeAllListeners("diligent.wsapi#loaded");
        DiligentClient.removeAllListeners("diligent.wsapi#error");

        ExtensionClient.removeAllListeners("extension.load#success");
        ExtensionClient.removeAllListeners("extension.unload#success");
        ExtensionClient.removeAllListeners("extension.load#error");
        ExtensionClient.removeAllListeners("extension.unload#error");
    },

    loadExtension: function(extensionModule) {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.EXTENSION_LOAD,
            name: extensionModule.name,
            version: extensionModule.version
        });

        ExtensionClient.load(extensionModule);
    },

    unloadExtension: function(extensionModule) {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.EXTENSION_UNLOAD,
            name: extensionModule.name,
            version: extensionModule.version
        });

        ExtensionClient.unload(extensionModule);
    }
};
