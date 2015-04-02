var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');

var CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

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

    /**
     * Build real path from node or string
     * @param {object/string} jqTree node object or relative path string
     */
    getPath: function(node) {
        var path = "";

        if (typeof node === "object")
            path = "/" + node.id;
        else if (typeof node === "string")
            path = node;

        return "bookshelf" + path;
    }
});

DatabaseStore.dispatchToken = NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        default:
            break;
    }
});

module.exports = DatabaseStore;
