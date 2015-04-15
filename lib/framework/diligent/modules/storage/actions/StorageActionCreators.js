var StorageDispatcher = require('../dispatcher/StorageDispatcher');
var StorageConstants = require('../constants/StorageConstants');

var StorageActionCreators = {

    listenNotifications: function() {
        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.removable.insert",
            function(disk) {
                StorageDispatcher.dispatch({
                    actionType: StorageConstants.STORAGE_ADD,
                    disk: disk
                });
            }
        );

        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.removable.remove",
            function(disk) {
                StorageDispatcher.dispatch({
                    actionType: StorageConstants.STORAGE_REMOVE,
                    disk: disk
                });
            }
        );

        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.inuse.change",
            function(disk) {}
        );
    },

    list: function() {
        DiligentAgent.getClient().storageManager.getLocalDisks(function(disks, error) {
            if (error)
                StorageDispatcher.dispatch({
                    actionType: StorageConstants.STORAGE_LIST,
                    error: error
                });
            else
                StorageDispatcher.dispatch({
                    actionType: StorageConstants.STORAGE_LIST,
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
                    StorageDispatcher.dispatch({
                        actionType: StorageConstants.STORAGE_SET_DISK_INUSE,
                        disk: _disk
                    });
                else
                    StorageDispatcher.dispatch({
                        actionType: StorageConstants.STORAGE_SET_DISK_INUSE,
                        error: "unable to set disk in use"
                    });
            });
        });
    }
}

module.exports = StorageActionCreators;
