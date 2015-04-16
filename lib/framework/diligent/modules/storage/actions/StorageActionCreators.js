var StorageDispatcher = require('../dispatcher/StorageDispatcher');
var StorageConstants = require('../constants/StorageConstants');

var StorageActionCreators = {
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
        StorageDispatcher.dispatch({
            actionType: StorageConstants.STORAGE_SET_DISK_INUSE,
            disk: disk
        });

        DiligentAgent.getClient().storageManager.setDiskInUse(disk, function() {
            DiligentAgent.getClient().storageManager.getDiskInUse(function(_disk) {
                if (disk.uuid === _disk.uuid)
                    StorageDispatcher.dispatch({
                        actionType: StorageConstants.STORAGE_SET_DISK_INUSE_SUCCESS,
                        disk: _disk
                    });
                else
                    StorageDispatcher.dispatch({
                        actionType: StorageConstants.STORAGE_SET_DISK_INUSE_FAIL,
                        disk: disk
                    });
            });
        });
    }
}

module.exports = StorageActionCreators;
