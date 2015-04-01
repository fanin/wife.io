var NotificationController = require('framework/cutie/Notification/js/NotificationController');
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

function onStorageDiskInsert(disk) {
    NotificationController.add(
        "Disk added",
        "A disk is inserted and mounted at " + disk.mountpoint,
        "/apps/b/storage/img/icon.png",
        5000
    );
}

function onStorageDiskRemove(disk) {
    NotificationController.add(
        "Disk removed",
        "Disk which was mounted at " + disk.mountpoint + " is removed",
        "/apps/b/storage/img/icon.png",
        5000
    );
}

function onStorageUserDataDiskChange(disk) {
    NotificationController.add(
        "User data disk changed",
        "User data disk is switched to " + disk.name,
        "/apps/b/storage/img/icon.png",
        5000
    );
}

function onStorageUserDataDiskSet(disk) {
    NotificationController.add(
        "User data disk",
        "User data disk is set to " + disk.name,
        "/apps/b/storage/img/icon.png",
        5000
    );
}

function onStorageError(error) {
    if (error === "ERROR-STOR-NO-USER-DISK")
        NotificationController.add(
            "Storage Error",
            "No internal user storage found",
            "/apps/b/storage/img/icon.png",
            0
        );
    else
        NotificationController.add(
            "Storage Error",
            error,
            "/apps/b/storage/img/icon.png",
            0
        );
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

        StorageClient.on("storage.notification#diskinsert", onStorageDiskInsert);
        StorageClient.on("storage.notification#diskremove", onStorageDiskRemove);
        StorageClient.on("storage.notification#userdatadiskchange", onStorageUserDataDiskChange);
        StorageClient.on("storage.notification#userdatadiskset", onStorageUserDataDiskSet);
        StorageClient.on("storage.notification#error", onStorageError);

        NotificationController.init();
        DiligentClient.init();
    },

    terminateDiligentClient: function() {
        DiligentDispatcher.dispatch({
            actionType: DiligentConstants.DILIGENT_CLIENT_TERMINATE
        });

        DiligentClient.removeListener("diligent.connection#established", onDiligentConnect);
        DiligentClient.removeListener("diligent.connection#closed", onDiligentDisconnect);
        DiligentClient.removeListener("diligent.connection#error", onDiligentConnectFail);
        DiligentClient.removeListener("diligent.wsapi#loaded", onDiligentWSApiLoad);
        DiligentClient.removeListener("diligent.wsapi#error", onDiligentWSApiLoadFail);

        ExtensionClient.removeListener("extension.load#success", onExtensionLoad);
        ExtensionClient.removeListener("extension.unload#success", onExtensionUnload);
        ExtensionClient.removeListener("extension.load#error", onExtensionLoadFail);
        ExtensionClient.removeListener("extension.unload#error", onExtensionUnloadFail);

        StorageClient.removeListener("storage.notification#diskinsert", onStorageDiskInsert);
        StorageClient.removeListener("storage.notification#diskremove", onStorageDiskRemove);
        StorageClient.removeListener("storage.notification#userdatadiskchange", onStorageUserDataDiskChange);
        StorageClient.removeListener("storage.notification#userdatadiskset", onStorageUserDataDiskSet);
        StorageClient.removeListener("storage.notification#error", onStorageError);

        NotificationController.deinit();
        DiligentClient.deinit();
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
