'use strict';

var assign                = require('object-assign');
var EventEmitter          = require('events').EventEmitter;
var StorageActionCreators = require('../actions/StorageActionCreators');
var StorageConstants      = require('../constants/StorageConstants');
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

        StorageStore.removeChangeListener(this._onStorageChange);
    },

    _onStorageChange: function(change) {
        switch (change) {
            case StorageConstants.STORAGE_LIST:
                StorageAgent.emit('storage.listDidReceive');
                break;
            case StorageConstants.STORAGE_ADD:
                StorageAgent.emit('storage.diskDidMount');
                break;
            case StorageConstants.STORAGE_REMOVE:
                StorageAgent.emit('storage.diskDidUnmount');
                break;
            case StorageConstants.STORAGE_SET_DISK_INUSE:
                StorageAgent.emit('storage.diskInUseWillSet');
                break;
            case StorageConstants.STORAGE_SET_DISK_INUSE_SUCCESS:
                StorageAgent.emit('storage.diskInUseDidSet');
                break;
            case StorageConstants.STORAGE_SET_DISK_INUSE_FAIL:
                StorageAgent.emit('storage.setDiskInUseFail');
                break;
            case StorageConstants.STORAGE_DISK_INUSE_CHANGE:
                StorageAgent.emit('storage.diskInUseDidChange');
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
            StorageAgent.on('storage.diskInUseDidChange', component.storageSetInUseFail);
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
    }
});

module.exports = StorageAgent;
