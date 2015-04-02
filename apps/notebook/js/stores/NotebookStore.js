var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var CHANGE_EVENT = 'NOTEBOOK_STORE_CHANGE';

var NotebookStore = assign({}, EventEmitter.prototype, {
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
    }
});

// Register callback to handle all updates
NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        default:
            break;
    }
});

module.exports = NotebookStore;
