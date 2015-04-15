var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

var treeData = null;
var createdStack = { id: null, name: '' };
var createdNotebook = { id: null, name: '' };
var trashedNotebook = { id: null };
var selectedNotebook = { id: null };
var error = null;

var DatabaseStore = assign({}, EventEmitter.prototype, {
    emitChange: function(changes) {
        this.emit(CHANGE_EVENT, changes);
    },

    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getTreeData: function() {
        return treeData;
    },

    getCreatedStack: function() {
        return createdStack;
    },

    getCreatedNotebook: function() {
        return createdNotebook;
    },

    getTrashedNotebook: function() {
        return trashedNotebook;
    },

    getSelectedNotebook: function() {
        return selectedNotebook;
    },

    getError: function() {
        return error;
    }
});

DatabaseStore.dispatchToken = NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS:
        case NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_SUCCESS:
            treeData = action.treeData;
            DatabaseStore.emitChange(action.actionType);
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_STACK:
            createdStack.id = action.id;
            createdStack.name = action.name;
            DatabaseStore.emitChange(action.actionType);
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_SUCCESS:
            createdNotebook.id = action.id;
            createdNotebook.name = action.name;
            DatabaseStore.emitChange(action.actionType);
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_SUCCESS:
            trashedNotebook.id = action.id;
            DatabaseStore.emitChange(action.actionType);
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_SELECT:
            selectedNotebook.id = action.id;
            DatabaseStore.emitChange(action.actionType);
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR:
        case NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_ERROR:
        case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_ERROR:
        case NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_ERROR:
            error = action.error;
            DatabaseStore.emitChange(action.actionType);
            break;
    }
});

module.exports = DatabaseStore;
