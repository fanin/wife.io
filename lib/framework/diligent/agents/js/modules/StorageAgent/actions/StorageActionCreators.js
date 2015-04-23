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

        DiligentAgent.getClient().storageManager.setDiskInUse(disk, function(_disk) {
            StorageDispatcher.dispatch({
                actionType: StorageConstants.STORAGE_SET_DISK_INUSE_SUCCESS,
                disk: _disk
            });
        }, function(error) {
            StorageDispatcher.dispatch({
                actionType: StorageConstants.STORAGE_SET_DISK_INUSE_FAIL,
                disk: disk,
                error: error
            });
        });
    }
}

module.exports = StorageActionCreators;
