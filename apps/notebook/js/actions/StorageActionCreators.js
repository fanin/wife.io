var DefaultDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants = require('../constants/NotebookConstants');

var StorageActionCreators = {

    initNotifications: function() {
        DiligentAgent.getClient().notificationCenter.addObserver("Storage", "DiskInsert", function(disk) {
            DefaultDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_ADD,
                disk: disk
            });
        });

        DiligentAgent.getClient().notificationCenter.addObserver("Storage", "DiskRemove", function(disk) {
            DefaultDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_REMOVE,
                disk: disk
            });
        });

        DiligentAgent.getClient().notificationCenter.addObserver("Storage", "WorkingDiskChange", function(disk) {

        });

        DiligentAgent.getClient().notificationCenter.addObserver("Storage", "WorkingDiskSet", function(disk) {
            DefaultDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_SET_WORKING_DISK,
                disk: disk
            });
        });
    },

    list: function() {
        DiligentAgent.getClient().storageManager.getLocalDisks(function(disks, error) {
            if (error)
                DefaultDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_LIST,
                    error: error
                });
            else
                DefaultDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_LIST,
                    systemDisk: disks.system,
                    dataDisk: disks.data,
                    removableDisks: disks.removable
                });
        });
    },

    setWorkingDisk: function(disk) {
        DiligentAgent.getClient().storageManager.setWorkingDisk(disk);
    }
}

module.exports = StorageActionCreators;
