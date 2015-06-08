var NotebookDispatcher      = require("../dispatcher/NotebookDispatcher");
var NotebookConstants       = require("../constants/NotebookConstants");
var NotebookActionConstants = require("../constants/NotebookActionConstants");
var EventEmitter            = require("events").EventEmitter;
var assign                  = require("object-assign");
var basename                = require("utils/client-utils").basename;

var CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

var treeData = null;
var isSearchingNotebook = false;
var superNotebookNode = null;
var superSearchNotebookNode = null;
var selectedNotebookNode = null;
var selectedSearchNotebookNode = null;
var noteDescriptorList = [];
var dirtyNoteDescriptorList = [];
var selectedNoteDescriptor = null;
var sortMethod = null;
var searchString = "";
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

    getSuperNotebookNode: function() {
        if (isSearchingNotebook)
            return superSearchNotebookNode;
        else
            return superNotebookNode;
    },

    getSelectedNotebookNode: function() {
        if (isSearchingNotebook)
            return selectedSearchNotebookNode;
        else
            return selectedNotebookNode;
    },

    getNoteDescriptorList: function() {
        return noteDescriptorList;
    },

    getDirtyNoteDescriptorList: function() {
        return dirtyNoteDescriptorList;
    },

    getSelectedNoteDescriptor: function() {
        return selectedNoteDescriptor;
    },

    getNoteDescriptorIndex: function(noteDescriptor) {
        if (!noteDescriptor)
            return -1;
        else
            return noteDescriptorList
                .map(function(_noteDescriptor) { return _noteDescriptor.noteId })
                .indexOf(noteDescriptor.noteId);
    },

    getDirtyNoteDescriptorIndex: function(noteDescriptor) {
        if (!noteDescriptor)
            return -1;
        else
            return dirtyNoteDescriptorList
                .map(function(_noteDescriptor) { return _noteDescriptor.noteId })
                .indexOf(noteDescriptor.noteId);
    },

    getNoteListSortMethod: function() {
        return sortMethod;
    },

    getSearchString: function() {
        return searchString;
    },

    getError: function() {
        return error;
    }
});

DatabaseStore.dispatchToken = NotebookDispatcher.register(function(action) {
    switch (action.actionType) {
        case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS:
        case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS:
            treeData = action.treeData;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_STACK:
            DatabaseStore.emitChange({
                actionType:    action.actionType,
                stack: {
                    stackId:   action.stackId,
                    stackName: action.stackName
                }
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
            DatabaseStore.emitChange({
                actionType:       action.actionType,
                notebook: {
                    notebookId:   action.notebookId,
                    notebookName: action.notebookName
                }
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS:
            DatabaseStore.emitChange({
                actionType:   action.actionType,
                notebookNode: action.notebookNode
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK:
            isSearchingNotebook = action.notebookNode.isSearching;
            if (action.notebookNode.isSearching) {
                if (action.notebookNode.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID)
                    superSearchNotebookNode = action.notebookNode;
                selectedSearchNotebookNode = action.notebookNode;
            }
            else {
                if (action.notebookNode.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID)
                    superNotebookNode = action.notebookNode;
                selectedNotebookNode = action.notebookNode;
                superSearchNotebookNode = null;
                selectedSearchNotebookNode = null;
            }
            DatabaseStore.emitChange({
                actionType: action.actionType,
                notebookNode: action.notebookNode
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD:
            if (sortMethod !== action.method) {
                sortMethod = action.method;
                noteDescriptorList.sort(sortMethod);
                DatabaseStore.emitChange({ actionType: action.actionType });
            }
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES:
            searchString = action.searchString;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
            noteDescriptorList = action.noteDescriptors.sort(sortMethod);
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
            if (
                action.index >= 0 &&
                action.index < noteDescriptorList.length &&
                selectedNoteDescriptor !== noteDescriptorList[action.index]
            ) {
                if (selectedNoteDescriptor &&
                    (
                        selectedNoteDescriptor.dirtyNoteTitle ||
                        selectedNoteDescriptor.dirtyNoteContent
                    )
                ) {
                    if (DatabaseStore.getDirtyNoteDescriptorIndex(selectedNoteDescriptor) < 0)
                        dirtyNoteDescriptorList.push(selectedNoteDescriptor);
                }
                selectedNoteDescriptor = noteDescriptorList[action.index];
                DatabaseStore.emitChange({ actionType: action.actionType });
            }
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS:
            if (selectedNotebookNode.id === action.noteDescriptor.notebookNode.id) {
                noteDescriptorList.unshift(action.noteDescriptor);
                noteDescriptorList.sort(sortMethod);
                DatabaseStore.emitChange({
                    actionType:     action.actionType,
                    noteDescriptor: action.noteDescriptor,
                    index:          DatabaseStore.getNoteDescriptorIndex(action.noteDescriptor)
                });
            }
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS:
            if (
                selectedNotebookNode.id === action.dstNoteDescriptor.notebookNode.id ||
                selectedNotebookNode.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID ||
                selectedNotebookNode.isFolder()
            ) {
                noteDescriptorList.unshift(action.dstNoteDescriptor);
                noteDescriptorList.sort(sortMethod);
                DatabaseStore.emitChange({
                    actionType:     action.actionType,
                    noteDescriptor: action.dstNoteDescriptor,
                    index:          DatabaseStore.getNoteDescriptorIndex(action.dstNoteDescriptor)
                });
            }
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
            var _i = DatabaseStore.getNoteDescriptorIndex(action.noteDescriptor);
            noteDescriptorList.splice(_i, 1);
            DatabaseStore.emitChange({
                actionType:     action.actionType,
                noteDescriptor: action.noteDescriptor,
                index:          _i
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
            var _i = DatabaseStore.getDirtyNoteDescriptorIndex(action.noteDescriptor);
            if (_i >= 0)
                dirtyNoteDescriptorList.splice(_i, 1);
            DatabaseStore.emitChange({
                actionType:     action.actionType,
                noteDescriptor: action.noteDescriptor,
                dirtyIndex:     _i
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE:
        case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS:
        case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
        case NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS:
        case NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS:
        case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT:
        case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS:
        case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE:
        case NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE:
            DatabaseStore.emitChange({
                actionType:     action.actionType,
                noteDescriptor: action.noteDescriptor
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_PROGRESS:
            var _noteDescriptor = action.noteDescriptor;
            _noteDescriptor.uploadFileObject = action.fileObject;
            _noteDescriptor.uploadProgress = action.progress;
            _noteDescriptor.uploadOverallProgress = action.overallProgress;
            DatabaseStore.emitChange({
                actionType:     action.actionType,
                noteDescriptor: _noteDescriptor
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_SUCCESS:
            var _noteDescriptor = action.noteDescriptor;
            _noteDescriptor.uploadFileObject = null;
            _noteDescriptor.uploadProgress = null;
            DatabaseStore.emitChange({
                actionType:     action.actionType,
                noteDescriptor: _noteDescriptor
            });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_CACHE_DIRTY_NOTE:
            if (DatabaseStore.getDirtyNoteDescriptorIndex(action.noteDescriptor) < 0)
                dirtyNoteDescriptorList.push(action.noteDescriptor);
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_ERROR:
            DatabaseStore.emitChange({ actionType: action.actionType, file: action.fileObject });
            break;

        case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR:
        case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR:
            error = action.error;
            DatabaseStore.emitChange({ actionType: action.actionType });
            break;
    }
});

module.exports = DatabaseStore;
