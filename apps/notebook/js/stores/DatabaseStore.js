var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter = require('events').EventEmitter;
var assign       = require('object-assign');

var CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

var treeData = null;
var error = null;

var DatabaseStore = assign({}, EventEmitter.prototype, {
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

    getTreeData: function() {
        return treeData;
    },

    getError: function() {
        return error;
    }
});

DatabaseStore.dispatchToken = NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE:
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS:
            treeData = action.treeData;
            DatabaseStore.emitChange(action.actionType);
            break;
        case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR:
            error = action.error;
            DatabaseStore.emitChange(action.actionType);
            break;
    }
});

module.exports = DatabaseStore;
