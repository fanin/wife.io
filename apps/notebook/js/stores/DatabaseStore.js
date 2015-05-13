var NotebookDispatcher = require('../dispatcher/NotebookDispatcher');
var NotebookConstants  = require('../constants/NotebookConstants');
var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');
var basename           = require('utils/client-utils').basename;

var CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

var treeData = null;
var selectedNotebookNode = null;
var noteDescriptorList = null;
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

    getSelectedNotebookNode: function() {
        return selectedNotebookNode;
    },

    getNoteDescriptorList: function() {
        return noteDescriptorList;
    },

    getSelectedNoteDescriptor: function() {
        if (selectedNoteIndex >= 0)
            return noteDescriptorList[selectedNoteIndex];
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
                    stackId: action.stackId,
                    stackName: action.stackName
                }
            });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
            DatabaseStore.emitChange({
                actionType: action.actionType,
                notebook: {
                    notebookId: action.notebookId,
                    notebookName: action.notebookName
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

                if (noteDescriptorList) {
                    var _selectNote = DatabaseStore.getSelectedNoteDescriptor();
                    noteDescriptorList.sort(sortMethod);
                    _index = noteDescriptorList.map(function(noteDescriptor) {
                        return noteDescriptor.noteId;
                    }).indexOf(_selectNote.noteId);
                }

                DatabaseStore.emitChange({
                    actionType: action.actionType,
                    method: sortMethod,
                    index: _index
                });
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
            noteDescriptorList = action.noteDescriptors.sort(sortMethod);
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
            if (
                action.index >= 0 &&
                action.index < noteDescriptorList.length
            ) {
                selectedNoteIndex = action.index;
                DatabaseStore.emitChange({ actionType: action.actionType });
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS:
            if (selectedNotebookNode.id === action.noteDescriptor.notebookNode.id) {
                noteDescriptorList.unshift(action.noteDescriptor);
                noteDescriptorList.sort(sortMethod);
                var _index = noteDescriptorList.map(function(noteDescriptor) { return noteDescriptor.noteId })
                                               .indexOf(action.noteDescriptor.noteId);
                DatabaseStore.emitChange({
                    actionType: action.actionType,
                    noteDescriptor: action.noteDescriptor,
                    index: _index
                });
            }
            break;
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
            for (var i = 0; i < noteDescriptorList.length; i++) {
                if (noteDescriptorList[i].noteId === action.noteDescriptor.noteId) {
                    noteDescriptorList.splice(i, 1);
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
                selectedNotebookNode.id === action.dstNoteDescriptor.notebookNode.id ||
                selectedNotebookNode.id === 1 ||
                selectedNotebookNode.isFolder()
            ) {
                noteDescriptorList.unshift(action.dstNoteDescriptor);
                noteDescriptorList.sort(sortMethod);
                var _index = noteDescriptorList.map(function(noteDescriptor) { return noteDescriptor.noteId })
                                               .indexOf(action.dstNoteDescriptor.noteId);
                DatabaseStore.emitChange({
                    actionType: action.actionType,
                    noteDescriptor: action.dstNoteDescriptor,
                    index: _index
                });
            }
            break;

        case NotebookConstants.NOTEBOOK_DATABASE_LOAD_NOTE_CONTENT_SUCCESS:
        case NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_CONTENT_SUCCESS:
        case NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS:
        case NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS:
            DatabaseStore.emitChange({
                actionType: action.actionType,
                noteDescriptor: action.noteDescriptor
            });
            break;

        case NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_LOAD_NOTE_CONTENT_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_SAVE_NOTE_CONTENT_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR:
        case NotebookConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR:
            error = action.error;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;
    }
});

module.exports = DatabaseStore;
