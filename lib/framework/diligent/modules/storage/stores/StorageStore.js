var StorageDispatcher = require('../dispatcher/StorageDispatcher');
var StorageConstants  = require('../constants/StorageConstants');
var EventEmitter      = require('events').EventEmitter;
var assign            = require('object-assign');

var CHANGE_EVENT = 'STORAGE_STORE_CHANGE';
var disks = [];
var diskInUse = null;

var StorageStore = assign({}, EventEmitter.prototype, {
    emitChange: function(changes) {
        this.emit(CHANGE_EVENT, changes);
    },

    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getDisks: function() {
        return disks;
    },

    getDiskInUse: function() {
        return diskInUse;
    },

    isDiskInUse: function(disk) {
        if (disk && diskInUse && disk.uuid === diskInUse.uuid)
            return true;
        else
            return false;
    },

    getDiskByUUID: function(uuid) {
        for (var i in disks)
            if (disks[i].uuid === uuid)
                return disks[i];
        return null;
    }
});

StorageStore.dispatchToken = StorageDispatcher.register(function(action) {
    switch (action.actionType) {
        case StorageConstants.STORAGE_LIST:
            disks = [];

            if (action.dataDisk) {
                action.dataDisk.type = 'Data';
                if (!diskInUse)
                    diskInUse = action.dataDisk;
                disks.push(action.dataDisk);
            }

            if (action.removableDisks && action.removableDisks.length > 0) {
                for (var i in action.removableDisks) {
                    action.removableDisks[i].type = 'Removable';
                    disks.push(action.removableDisks[i]);
                }
            }

            StorageStore.emitChange(action.actionType);
            break;

        case StorageConstants.STORAGE_ADD:
            if (!action.disk || !action.disk.uuid) {
                console.log('Add disk error: invalid disk info');
                return;
            }

            for (var i in disks)
                if (disks[i].uuid === action.disk.uuid)
                    return;

            disks.push(action.disk);
            StorageStore.emitChange(action.actionType);
            break;

        case StorageConstants.STORAGE_REMOVE:
            if (!action.disk || !action.disk.uuid) {
                console.log('Remove disk error: invalid disk info');
                return;
            }

            for (var i in disks) {
                if (disks[i].uuid === action.disk.uuid) {
                    disks.splice(i, 1);

                    if (diskInUse.uuid === action.disk.uuid) {
                        DiligentAgent.getClient().storageManager.getDiskInUse(function(_disk) {
                            diskInUse = _disk;
                            StorageStore.emitChange(action.actionType);
                        }, function(error) {
                            diskInUse = disks[0];
                            StorageStore.emitChange(action.actionType);
                        });
                    }
                    else
                        StorageStore.emitChange(action.actionType);

                    break;
                }
            }

            break;

        case StorageConstants.STORAGE_SET_DISK_INUSE:
            if (action.disk && action.disk.uuid) {
                diskInUse = action.disk;
                StorageStore.emitChange(action.actionType);
            }

            break;
    }
});

module.exports = StorageStore;
