var StorageDispatcher = require('../dispatcher/StorageDispatcher');
var StorageConstants  = require('../constants/StorageConstants');
var EventEmitter      = require('events').EventEmitter;
var assign            = require('object-assign');

var CHANGE_EVENT = 'STORAGE_STORE_CHANGE';
var disks = [];
var diskInUse = null;
var diskAddLast = null;
var diskRemoveLast = null;
var diskError = null;

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
    },

    getDiskAddLast: function() {
        return diskAddLast;
    },

    getDiskRemoveLast: function() {
        return diskRemoveLast;
    },

    getDiskError: function() {
        return diskError;
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

            StorageStore.emitChange({ actionType: action.actionType, disks: disks });
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
            diskAddLast = action.disk;
            StorageStore.emitChange({ actionType: action.actionType, disk: action.disk });
            break;

        case StorageConstants.STORAGE_REMOVE:
            if (!action.disk || !action.disk.uuid) {
                console.log('Remove disk error: invalid disk info');
                return;
            }

            for (var i in disks) {
                if (disks[i].uuid === action.disk.uuid) {
                    diskRemoveLast = disks[i];
                    disks.splice(i, 1);
                    StorageStore.emitChange({ actionType: action.actionType, disk: action.disk });
                    break;
                }
            }

            break;

        case StorageConstants.STORAGE_SET_DISK_INUSE:
            StorageStore.emitChange({ actionType: action.actionType, disk: action.disk });
            break;

        case StorageConstants.STORAGE_SET_DISK_INUSE_SUCCESS:
        case StorageConstants.STORAGE_DISK_INUSE_CHANGE:
            diskInUse = action.disk;
            StorageStore.emitChange({ actionType: action.actionType, disk: action.disk });
            break;

        case StorageConstants.STORAGE_SET_DISK_INUSE_FAIL:
            StorageStore.emitChange({ actionType: action.actionType, disk: action.disk, error: action.error });
            break;

        case StorageConstants.STORAGE_ERROR:
            diskError = action.error;
            StorageStore.emitChange({ actionType: action.actionType, error: action.error });
            break;
    }
});

module.exports = StorageStore;
