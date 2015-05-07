var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');
var basename           = require('utils/client-utils').basename;

var CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

var treeData = null;
var selectedNotebookNode = null;
var noteList = null;
var selectedNoteIndex = -1;
var sortMethod = null;
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

    getSelectedNotebook: function() {
        return selectedNotebookNode;
    },

    getNoteList: function() {
        return noteList;
    },

    getSelectedNote: function() {
        if (selectedNoteIndex >= 0)
            return noteList[selectedNoteIndex];
        else
            return null;
    },

    getError: function() {
        return error;
    }
});

DatabaseStore.dispatchToken = NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        case NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS:
        case NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS:
            treeData = action.treeData;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_CREATE_STACK:
            DatabaseStore.emitChange({
                actionType: action.actionType,
                stack: {
                    id: action.id,
                    name: action.name
                }
            });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
            DatabaseStore.emitChange({
                actionType: action.actionType,
                notebook: {
                    id: action.id,
                    name: action.name
                }
            });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS:
            DatabaseStore.emitChange({
                actionType: action.actionType,
                notebookNode: action.notebookNode
            });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK:
            selectedNotebookNode = action.notebookNode;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;

        case NotebookConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD:
            var _index = -1;

            if (sortMethod !== action.method) {
                sortMethod = action.method;

                if (noteList) {
                    var _selectNote = DatabaseStore.getSelectedNote();
                    noteList.sort(sortMethod);
                    index = noteList.map(function(note) { return note.id; }).indexOf(_selectNote.id);
                }

                DatabaseStore.emitChange({
                    actionType: action.actionType,
                    method: sortMethod,
                    index: index
                });
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
            noteList = action.notes.sort(sortMethod);
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
            if (
                action.index >= 0 &&
                action.index < noteList.length &&
                action.index !== selectedNoteIndex
            ) {
                selectedNoteIndex = action.index;
                DatabaseStore.emitChange({ actionType: action.actionType });
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS:
            if (selectedNotebookNode.id === action.note.notebookNode.id) {
                noteList.unshift(action.note);
                noteList.sort(sortMethod);
                var index = noteList.map(function(note) { return note.id; }).indexOf(action.note.id);
                DatabaseStore.emitChange({
                    actionType: action.actionType,
                    note: action.note,
                    index: index
                });
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
            for (var i = 0; i < noteList.length; i++) {
                if (noteList[i].id === action.note.id) {
                    noteList.splice(i, 1);
                    DatabaseStore.emitChange({
                        actionType: action.actionType,
                        index: i
                    });
                    break;
                }
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS:
            if (
                selectedNotebookNode.id === action.note.notebookNode.id ||
                selectedNotebookNode.id === 1 ||
                selectedNotebookNode.isFolder()
            ) {
                noteList.unshift(action.note);
                noteList.sort(sortMethod);
                var index = noteList.map(function(note) { return note.id; }).indexOf(action.note.id);
                DatabaseStore.emitChange({
                    actionType: action.actionType,
                    note: action.note,
                    index: index
                });
            }
            break;

        case NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR:
            error = action.error;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;
    }
});

module.exports = DatabaseStore;
