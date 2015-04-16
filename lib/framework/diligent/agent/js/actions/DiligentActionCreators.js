var DiligentDispatcher = require('../dispatcher/DiligentDispatcher');
var DiligentConstants  = require('../constants/DiligentConstants');
var DiligentClient     = require('framework/diligent/clients/diligent-client');
var EventNotifier      = require('framework/cutie/EventNotifier/js/EventNotifier');

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
        actionType: DiligentConstants.DILIGENT_CLIENT_RUNNING,
        client: DiligentClient
    });
}

function onDiligentWSApiLoadFail(error) {
    DiligentDispatcher.dispatch({
        actionType: DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL,
        error: error
    });
}

var DiligentActionCreators = {
    register: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_INITIATE
        });

        DiligentClient.initiate();

        DiligentClient.on("diligent.connection.established", onDiligentConnect);
        DiligentClient.on("diligent.connection.closed", onDiligentDisconnect);
        DiligentClient.on("diligent.connection.error", onDiligentConnectFail);
        DiligentClient.on("diligent.wsapi.loaded", onDiligentWSApiLoad);
        DiligentClient.on("diligent.wsapi.error", onDiligentWSApiLoadFail);

        DiligentClient.notificationCenter.addObserver("system.storage", "disk.removable.insert", function(disk) {
            EventNotifier.add(
                "Disk added",
                "A disk is inserted and mounted at " + disk.mountpoint,
                "/apps/b/storage/img/icon.png",
                5000
            );
        });

        DiligentClient.notificationCenter.addObserver("system.storage", "disk.removable.remove", function(disk) {
            EventNotifier.add(
                "Disk removed",
                "Disk which was mounted at " + disk.mountpoint + " is removed",
                "/apps/b/storage/img/icon.png",
                5000
            );
        });

        DiligentClient.notificationCenter.addObserver("system.storage", "disk.inuse.change", function(disk) {
            EventNotifier.add(
                "Working disk changed",
                "Switching working disk to " + disk.name,
                "/apps/b/storage/img/icon.png",
                5000
            );
        });

        DiligentClient.notificationCenter.addObserver("system.storage", "disk.error", function(error) {
            if (error === "ERROR-STOR-NO-USER-DISK")
                EventNotifier.add(
                    "Storage Error",
                    "No internal user storage found",
                    "/apps/b/storage/img/icon.png",
                    0
                );
            else
                EventNotifier.add(
                    "Storage Error",
                    error,
                    "/apps/b/storage/img/icon.png",
                    0
                );
        });
    },

    unregister: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_TERMINATE
        });

        DiligentClient.removeListener("diligent.connection.established", onDiligentConnect);
        DiligentClient.removeListener("diligent.connection.closed", onDiligentDisconnect);
        DiligentClient.removeListener("diligent.connection.error", onDiligentConnectFail);
        DiligentClient.removeListener("diligent.wsapi.loaded", onDiligentWSApiLoad);
        DiligentClient.removeListener("diligent.wsapi.error", onDiligentWSApiLoadFail);

        DiligentClient.notificationCenter.removeAllObserver("system.storage", "disk.removable.insert");
        DiligentClient.notificationCenter.removeAllObserver("system.storage", "disk.removable.remove");
        DiligentClient.notificationCenter.removeAllObserver("system.storage", "disk.inuse.change");
        DiligentClient.notificationCenter.removeAllObserver("system.storage", "disk.error");

        DiligentClient.terminate();

        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_STOPPED
        });
    }
}

module.exports = DiligentActionCreators;
