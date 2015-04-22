var DiligentDispatcher = require('../dispatcher/DiligentDispatcher');
var DiligentConstants  = require('../constants/DiligentConstants');
var DiligentClient     = require('framework/diligent/clients/diligent-client');

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

var DiligentActionCreators = {
    launch: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_INITIATE,
            client: DiligentClient
        });

        DiligentClient.initiate();

        DiligentClient.on("diligent.connection.established", onDiligentConnect);
        DiligentClient.on("diligent.connection.closed", onDiligentDisconnect);
        DiligentClient.on("diligent.connection.error", onDiligentConnectFail);
        DiligentClient.on("diligent.wsapi.loaded", onDiligentWSApiLoad);
        DiligentClient.on("diligent.wsapi.error", onDiligentWSApiLoadFail);
    },

    terminate: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_TERMINATE
        });

        DiligentClient.removeListener("diligent.connection.established", onDiligentConnect);
        DiligentClient.removeListener("diligent.connection.closed", onDiligentDisconnect);
        DiligentClient.removeListener("diligent.connection.error", onDiligentConnectFail);
        DiligentClient.removeListener("diligent.wsapi.loaded", onDiligentWSApiLoad);
        DiligentClient.removeListener("diligent.wsapi.error", onDiligentWSApiLoadFail);

        DiligentClient.terminate();

        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_STOPPED
        });
    }
}

module.exports = DiligentActionCreators;
