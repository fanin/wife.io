var DefaultDispatcher      = require('../dispatcher/NotebookDispatcher');
var NotebookConstants      = require('../constants/NotebookConstants');
var DiligentActionCreators = DiligentAgent.actions;

function onStorageListSuccess(disks) {
    DefaultDispatcher.dispatch({
        actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_LIST,
        systemDisk: disks.system,
        dataDisk: disks.data,
        removableDisks: disks.removable
    });
}

function onStorageListError(error) {

}

function onInsertDisk(disk) {
    DefaultDispatcher.dispatch({
        actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_ADD,
        disk: disk
    });
}

function onRemoveDisk(disk) {
    DefaultDispatcher.dispatch({
        actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_REMOVE,
        disk: disk
    });
}

function onWorkingDiskSet(disk) {
    DefaultDispatcher.dispatch({
        actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_SET_WORKING_DISK,
        disk: disk
    });
}

var StorageActionCreators = {
    register: function() {
        StorageClient.on("storage.localdisk#list#success", onStorageListSuccess);
        StorageClient.on("storage.localdisk#list#error", onStorageListError);
        StorageClient.on("storage.notification#diskinsert", onInsertDisk);
        StorageClient.on("storage.notification#diskremove", onRemoveDisk);
        StorageClient.on("storage.notification#workingdiskset", onWorkingDiskSet);
    },

    unregister: function() {
        StorageClient.removeListener("storage.localdisk#list#success", onStorageListSuccess);
        StorageClient.removeListener("storage.localdisk#list#error", onStorageListError);
        StorageClient.removeListener("storage.notification#diskinsert", onInsertDisk);
        StorageClient.removeListener("storage.notification#diskremove", onRemoveDisk);
        StorageClient.removeListener("storage.notification#workingdiskset", onWorkingDiskSet);
    },

    list: function() {
        StorageClient.getLocalDisks();
    },

    setWorkingDisk: function(disk) {
        StorageClient.setWorkingDisk(disk);
    }
}

module.exports = StorageActionCreators;
