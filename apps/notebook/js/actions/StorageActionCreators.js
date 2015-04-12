var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants = require('../constants/NotebookConstants');

var StorageActionCreators = {

    initNotifications: function() {
        DiligentAgent.getClient().notificationCenter.addObserver("system.storage", "disk.removable.insert", function(disk) {
            NotebookDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_ADD,
                disk: disk
            });
        });

        DiligentAgent.getClient().notificationCenter.addObserver("system.storage", "disk.removable.remove", function(disk) {
            NotebookDispatcher.dispatch({
                actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_REMOVE,
                disk: disk
            });
        });

        DiligentAgent.getClient().notificationCenter.addObserver("system.storage", "disk.inuse.change", function(disk) {

        });
    },

    list: function() {
        DiligentAgent.getClient().storageManager.getLocalDisks(function(disks, error) {
            if (error)
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_LIST,
                    error: error
                });
            else
                NotebookDispatcher.dispatch({
                    actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_LIST,
                    systemDisk: disks.system,
                    dataDisk: disks.data,
                    removableDisks: disks.removable
                });
        });
    },

    setDiskInUse: function(disk) {
        DiligentAgent.getClient().storageManager.setDiskInUse(disk, function() {
            DiligentAgent.getClient().storageManager.getDiskInUse(function(_disk) {
                if (disk.uuid === _disk.uuid)
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_SET_DISK_INUSE,
                        disk: _disk
                    });
                else
                    NotebookDispatcher.dispatch({
                        actionType: NotebookConstants.NOTEBOOK_APP_STORAGE_SET_DISK_INUSE,
                        error: "unable to set disk in use"
                    });
            });
        });
    }
}

module.exports = StorageActionCreators;
