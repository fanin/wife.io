var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var CHANGE_EVENT = 'STORAGE_STORE_CHANGE';
var disks = [];
var workingDisk = null;

var StorageStore = assign({}, EventEmitter.prototype, {
    emitChange: function(changes) {
        this.emit(CHANGE_EVENT, changes);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getDisks: function() {
        return disks;
    },

    getWorkingDisk: function() {
        return workingDisk;
    },

    getDiskByUUID: function(uuid) {
        for (var i in disks)
            if (disks[i].uuid === uuid)
                return disks[i];
        return null;
    }
});

// Register callback to handle all updates
StorageStore.dispatchToken = NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        case NotebookConstants.NOTEBOOK_APP_STORAGE_LIST:
            disks = [];

            if (action.dataDisk) {
                action.dataDisk.type = 'Data';
                if (!workingDisk) {
                    action.dataDisk.isWorkingDisk = true;
                    workingDisk = action.dataDisk;
                }
                else if (workingDisk.uuid === action.dataDisk.uuid)
                    action.dataDisk.isWorkingDisk = true;
                else
                    action.dataDisk.isWorkingDisk = false;
                disks.push(action.dataDisk);
            }

            if (action.systemDisk) {
                action.systemDisk.type = 'System';
                if (!workingDisk) {
                    action.systemDisk.isWorkingDisk = true;
                    workingDisk = action.systemDisk;
                }
                else if (workingDisk.uuid === action.systemDisk.uuid)
                    action.systemDisk.isWorkingDisk = true;
                else
                    action.systemDisk.isWorkingDisk = false;
                disks.push(action.systemDisk);
            }

            if (action.removableDisks && action.removableDisks.length > 0) {
                for (var i in action.removableDisks) {
                    action.removableDisks[i].type = 'Removable';
                    if (workingDisk && workingDisk.uuid === action.removableDisks[i].uuid)
                        action.removableDisks[i].isWorkingDisk = true;
                    else
                        action.removableDisks[i].isWorkingDisk = false;
                    disks.push(action.removableDisks[i]);
                }
            }

            StorageStore.emitChange(action.actionType);
            break;

        case NotebookConstants.NOTEBOOK_APP_STORAGE_ADD:
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

        case NotebookConstants.NOTEBOOK_APP_STORAGE_REMOVE:
            if (!action.disk || !action.disk.uuid) {
                console.log('Remove disk error: invalid disk info');
                return;
            }

            for (var i in disks) {
                if (disks[i].uuid === action.disk.uuid) {
                    disks.splice(i, 1);
                    if (workingDisk.uuid === action.disk.uuid)
                        DiligentAgent.getClient().storageManager.setWorkingDisk(disks[0]);
                    else
                        StorageStore.emitChange(action.actionType);
                }
            }

            break;

        case NotebookConstants.NOTEBOOK_APP_STORAGE_SET_WORKING_DISK:
            if (action.disk && action.disk.uuid) {
                for (var i in disks) {
                    if (disks[i].uuid === action.disk.uuid) {
                        workingDisk.isWorkingDisk = false;
                        disks[i].isWorkingDisk = true;
                        workingDisk = disks[i];
                        StorageStore.emitChange(action.actionType);
                    }
                }
            }

            break;
    }
});

module.exports = StorageStore;
