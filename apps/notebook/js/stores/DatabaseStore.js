import EventEmitter from 'events';
import NotebookDispatcher from '../dispatcher/NotebookDispatcher';
import NotebookConstants from '../constants/NotebookConstants';
import NotebookActionConstants from '../constants/NotebookActionConstants';

const CHANGE_EVENT = 'NOTEBOOK_DATABASE_STORE_CHANGE';

var storage = null;
var treeData = null;
var isSearchingNotebook = false;
var superNotebookNode = null;
var superSearchNotebookNode = null;
var selectedNotebookNode = null;
var selectedSearchNotebookNode = null;
var noteDescriptorList = [];
var dirtyNoteDescriptorList = [];
var savingNoteDescriptorList = [];
var selectedNoteDescriptor = null;
var sortMethod = null;
var searchString = "";
var error = null;

class DatabaseStore extends EventEmitter {

  constructor() {
    super();
  }

  emitChange(changes) {
    this.emit(CHANGE_EVENT, changes);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  getStorage() {
    return storage;
  }

  getTreeData() {
    return treeData;
  }

  getSuperNotebookNode() {
    if (isSearchingNotebook)
      return superSearchNotebookNode;
    else
      return superNotebookNode;
  }

  getSelectedNotebookNode() {
    if (isSearchingNotebook)
      return selectedSearchNotebookNode;
    else
      return selectedNotebookNode;
  }

  getNoteDescriptorList() {
    return noteDescriptorList;
  }

  getDirtyNoteDescriptorList() {
    return dirtyNoteDescriptorList;
  }

  getNoteDescriptorIndex(descriptor) {
    return descriptor
        ? noteDescriptorList
          .map(_descriptor => _descriptor.id)
          .indexOf(descriptor.id)
        : -1;
  }

  getDirtyNoteDescriptorIndex(descriptor) {
    return descriptor
        ? dirtyNoteDescriptorList
          .map(_descriptor => _descriptor.id)
          .indexOf(descriptor.id)
        : -1;
  }

  getSavingNoteDescriptorIndex(descriptor) {
    return descriptor
        ? savingNoteDescriptorList
          .map(_descriptor => _descriptor.id)
          .indexOf(descriptor.id)
        : -1;
  }

  getSelectedNoteDescriptor() {
    return selectedNoteDescriptor;
  }

  isNoteDescriptorSelected(descriptor) {
    return selectedNoteDescriptor && selectedNoteDescriptor.id === descriptor.id;
  }

  getNoteDescriptorStatus(descriptor) {
    return descriptor.status;
  }

  getNoteListSortMethod() {
    return sortMethod;
  }

  getSearchString() {
    return searchString;
  }

  getError() {
    return error;
  }
}

let databaseStore = new DatabaseStore();
export default databaseStore;

databaseStore.dispatchToken = NotebookDispatcher.register((action) => {
  switch (action.actionType) {
    case NotebookActionConstants.NOTEBOOK_DATABASE_OPEN:
      storage = action.storage;
      databaseStore.emitChange({ actionType: action.actionType });
      break;
    case NotebookActionConstants.NOTEBOOK_DATABASE_CLOSE:
      storage = null;
      databaseStore.emitChange({ actionType: action.actionType });
      break;
    case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS:
    case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS:
      treeData = action.treeData;
      databaseStore.emitChange({ actionType: action.actionType });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_STACK:
      databaseStore.emitChange({
        actionType: action.actionType,
        stack: {
          id: action.id,
          name: action.name
        }
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
      databaseStore.emitChange({
        actionType: action.actionType,
        notebook: {
          notebookId: action.notebookId,
          notebookName: action.notebookName
        }
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS:
      databaseStore.emitChange({
        actionType: action.actionType,
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
      databaseStore.emitChange({
        actionType: action.actionType,
        notebookNode: action.notebookNode
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD:
      if (sortMethod !== action.method) {
        sortMethod = action.method;
        noteDescriptorList.sort(sortMethod);
        databaseStore.emitChange({ actionType: action.actionType });
      }
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES:
      searchString = action.searchString;
      databaseStore.emitChange({ actionType: action.actionType });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
      noteDescriptorList =
        action.noteDescriptors.sort(sortMethod).map((descriptor) => {
          var idx = databaseStore.getSavingNoteDescriptorIndex(descriptor);
          if (idx >= 0)
            return savingNoteDescriptorList[idx];
          else
            return descriptor;
        });

      if (noteDescriptorList.length === 0)
        selectedNoteDescriptor = null;

      databaseStore.emitChange({ actionType: action.actionType });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
      if (
        action.index >= 0
        && action.index < noteDescriptorList.length
        && selectedNoteDescriptor !== noteDescriptorList[action.index]
      ) {
        selectedNoteDescriptor = noteDescriptorList[action.index];
        databaseStore.emitChange({ actionType: action.actionType });
      }
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS:
      if (selectedNotebookNode.id === action.noteDescriptor.notebookNode.id) {
        noteDescriptorList.unshift(action.noteDescriptor);
        noteDescriptorList.sort(sortMethod);
        databaseStore.emitChange({
          actionType: action.actionType,
          noteDescriptor: action.noteDescriptor,
          index: databaseStore.getNoteDescriptorIndex(action.noteDescriptor)
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
        databaseStore.emitChange({
          actionType: action.actionType,
          noteDescriptor: action.dstNoteDescriptor,
          index: databaseStore.getNoteDescriptorIndex(action.dstNoteDescriptor)
        });
      }
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
      var idx = databaseStore.getNoteDescriptorIndex(action.noteDescriptor);
      noteDescriptorList.splice(idx, 1);
      databaseStore.emitChange({
        actionType:     action.actionType,
        noteDescriptor: action.noteDescriptor,
        index:          idx
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
      action.noteDescriptor.status = 'Saving';
      action.noteDescriptor.saveManually = action.manually;

      if (databaseStore.getSavingNoteDescriptorIndex(action.noteDescriptor) < 0)
        savingNoteDescriptorList.push(action.noteDescriptor);

      databaseStore.emitChange({
        actionType:     action.actionType,
        noteDescriptor: action.noteDescriptor
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
    case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
      dirtyNoteDescriptorList.splice(
        databaseStore.getDirtyNoteDescriptorIndex(action.noteDescriptor), 1
      );
      savingNoteDescriptorList.splice(
        databaseStore.getSavingNoteDescriptorIndex(action.noteDescriptor), 1
      );

      action.noteDescriptor.status = '';
      var manually = action.noteDescriptor.saveManually;
      action.noteDescriptor.saveManually = undefined;

      databaseStore.emitChange({
        actionType: action.actionType,
        noteDescriptor: action.noteDescriptor,
        manually: manually
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE:
      if (action.noteDescriptor.status !== 'Saving')
        action.noteDescriptor.status = 'Loading';
      databaseStore.emitChange({
        actionType: action.actionType,
        noteDescriptor: action.noteDescriptor
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS:
    case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR:
      if (action.noteDescriptor.status !== 'Saving')
        action.noteDescriptor.status = '';
      databaseStore.emitChange({
        actionType: action.actionType,
        noteDescriptor: action.noteDescriptor
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS:
    case NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_SUCCESS:
    case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT:
    case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS:
    case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE:
    case NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE:
      databaseStore.emitChange({
        actionType: action.actionType,
        noteDescriptor: action.noteDescriptor
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_PROGRESS: {
      var _noteDescriptor = action.noteDescriptor;
      _noteDescriptor.uploadFileObject = action.fileObject;
      _noteDescriptor.uploadProgress = action.progress;
      _noteDescriptor.uploadOverallProgress = action.overallProgress;
      databaseStore.emitChange({
        actionType: action.actionType,
        noteDescriptor: _noteDescriptor
      });
      break;
    }

    case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_SUCCESS: {
      var _noteDescriptor = action.noteDescriptor;
      _noteDescriptor.uploadFileObject = null;
      _noteDescriptor.uploadProgress = null;
      databaseStore.emitChange({
        actionType: action.actionType,
        noteDescriptor: _noteDescriptor
      });
      break;
    }

    case NotebookActionConstants.NOTEBOOK_DATABASE_CACHE_DIRTY_NOTE:
      if (databaseStore.getDirtyNoteDescriptorIndex(action.noteDescriptor) < 0)
        dirtyNoteDescriptorList.push(action.noteDescriptor);
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_ERROR:
      databaseStore.emitChange({
        actionType: action.actionType,
        file: action.fileObject
      });
      break;

    case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_CLEAR_USELESS_NOTE_ASSETS_ERROR:
    case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_ERROR:
      error = action.error;
      databaseStore.emitChange({ actionType: action.actionType });
      break;
  }
});
