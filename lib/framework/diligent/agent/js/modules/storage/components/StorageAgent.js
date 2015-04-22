'use strict';

var assign                = require('object-assign');
var EventEmitter          = require('events').EventEmitter;
var StorageActionCreators = require('../actions/StorageActionCreators');
var StorageConstants      = require('../constants/StorageConstants');
var StorageDispatcher     = require('../dispatcher/StorageDispatcher');
var StorageStore          = require('../stores/StorageStore');

var StorageAgent = assign({}, EventEmitter.prototype, {
    _onStorageMount: function(disk) {
        StorageDispatcher.dispatch({
            actionType: StorageConstants.STORAGE_ADD,
            disk: disk
        });
    },

    _onStorageUnmount: function(disk) {
        StorageDispatcher.dispatch({
            actionType: StorageConstants.STORAGE_REMOVE,
            disk: disk
        });
    },

    _onStorageInUseChange: function(disk) {
        StorageDispatcher.dispatch({
            actionType: StorageConstants.STORAGE_DISK_INUSE_CHANGE,
            disk: disk
        });
    },

    _onStorageError: function(error) {
        StorageDispatcher.dispatch({
            actionType: StorageConstants.STORAGE_ERROR,
            error: error
        });
    },

    init: function() {
        StorageStore.addChangeListener(this._onStorageChange);

        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.removable.insert",
            this._onStorageMount
        );

        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.removable.remove",
            this._onStorageUnmount
        );

        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.inuse.change",
            this._onStorageInUseChange
        );

        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.error",
            this._onStorageError
        );
    },

    deinit: function() {
        DiligentAgent.getClient().notificationCenter.removeObserver(
            "system.storage",
            "disk.removable.insert",
            this._onStorageMount
        );

        DiligentAgent.getClient().notificationCenter.removeObserver(
            "system.storage",
            "disk.removable.remove",
            _onStorageUnmount
        );

        DiligentAgent.getClient().notificationCenter.removeObserver(
            "system.storage",
            "disk.inuse.change",
            _onStorageInUseChange
        );

        DiligentAgent.getClient().notificationCenter.removeObserver(
            "system.storage",
            "disk.error",
            this._onStorageError
        );

        StorageStore.removeChangeListener(this._onStorageChange);
    },

    _onStorageChange: function(change) {
        switch (change.actionType) {
            case StorageConstants.STORAGE_LIST:
                StorageAgent.emit('storage.listDidReceive', change.disks);
                break;
            case StorageConstants.STORAGE_ADD:
                StorageAgent.emit('storage.diskDidMount', change.disk);
                break;
            case StorageConstants.STORAGE_REMOVE:
                StorageAgent.emit('storage.diskDidUnmount', change.disk);
                break;
            case StorageConstants.STORAGE_SET_DISK_INUSE:
                StorageAgent.emit('storage.diskInUseWillSet', change.disk);
                break;
            case StorageConstants.STORAGE_SET_DISK_INUSE_SUCCESS:
                StorageAgent.emit('storage.diskInUseDidSet', change.disk);
                break;
            case StorageConstants.STORAGE_SET_DISK_INUSE_FAIL:
                StorageAgent.emit('storage.setDiskInUseFail', { disk: change.disk, error: change.error });
                break;
            case StorageConstants.STORAGE_DISK_INUSE_CHANGE:
                StorageAgent.emit('storage.diskInUseDidChange', change.disk);
                break;
            case StorageConstants.STORAGE_ERROR:
                StorageAgent.emit('storage.diskHasError', change.error);
                break;
        }
    },

    attach: function(component) {
        if (component.storageDidReceiveList)
            StorageAgent.on('storage.listDidReceive', component.storageDidReceiveList);
        if (component.storageDidMount)
            StorageAgent.on('storage.diskDidMount', component.storageDidMount);
        if (component.storageDidUnmount)
            StorageAgent.on('storage.diskDidUnmount', component.storageDidUnmount);
        if (component.storageWillSetInUse)
            StorageAgent.on('storage.diskInUseWillSet', component.storageWillSetInUse);
        if (component.storageDidSetInUse)
            StorageAgent.on('storage.diskInUseDidSet', component.storageDidSetInUse);
        if (component.storageSetInUseFail)
            StorageAgent.on('storage.setDiskInUseFail', component.storageSetInUseFail);
        if (component.storageInUseDidChange)
            StorageAgent.on('storage.diskInUseDidChange', component.storageInUseDidChange);
        if (component.storageHasError)
            StorageAgent.on('storage.diskHasError', component.storageHasError);
    },

    detach: function(component) {
        if (component.storageDidReceiveList)
            StorageAgent.off('storage.listDidReceive', component.storageDidReceiveList);
        if (component.storageDidMount)
            StorageAgent.off('storage.diskDidMount', component.storageDidMount);
        if (component.storageDidUnmount)
            StorageAgent.off('storage.diskDidUnmount', component.storageDidUnmount);
        if (component.storageWillSetInUse)
            StorageAgent.off('storage.diskInUseWillSet', component.storageWillSetInUse);
        if (component.storageDidSetInUse)
            StorageAgent.off('storage.diskInUseDidSet', component.storageDidSetInUse);
        if (component.storageSetInUseFail)
            StorageAgent.off('storage.setDiskInUseFail', component.storageSetInUseFail);
        if (component.storageInUseDidChange)
            StorageAgent.off('storage.diskInUseDidChange', component.storageInUseDidChange);
        if (component.storageHasError)
            StorageAgent.off('storage.diskHasError', component.storageHasError);
    },

    list: function() {
        StorageActionCreators.list();
    },

    setDiskInUse: function(disk) {
        StorageActionCreators.setDiskInUse(disk);
    },

    getDisks: function() {
        return StorageStore.getDisks();
    },

    getDiskInUse: function() {
        return StorageStore.getDiskInUse();
    },

    isDiskInUse: function(disk) {
        return StorageStore.isDiskInUse(disk);
    },

    getDiskByUUID: function(uuid) {
        return StorageStore.getDiskByUUID(uuid);
    },

    getDiskAddLast: function() {
        return StorageStore.getDiskAddLast();
    },

    getDiskRemoveLast: function() {
        return StorageStore.getDiskRemoveLast();
    },

    getDiskError: function() {
        return StorageStore.getDiskError();
    }
});

module.exports = StorageAgent;
