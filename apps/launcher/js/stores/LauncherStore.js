import EventEmitter from 'events';
import FSAPI from 'lib/api/FSAPI';
import LauncherDispatcher from '../dispatcher/LauncherDispatcher';
import LauncherConstants from '../constants/LauncherConstants';

const CHANGE_EVENT = 'LAUNCHER_CHANGE';
const ERROR_EVENT  = 'LAUNCHER_ERROR';
const APPSORT_FILE = 'appsort.json';

var appSortList = null;

class LauncherStore extends EventEmitter {

  constructor() {
    super();
  }

  /**
   * @param {object} changes object
   */
  emitChange(changes) {
    this.emit(CHANGE_EVENT, changes);
  }

  /**
   * @param {object} error object
   */
  emitError(error) {
    this.emit(ERROR_EVENT, error);
  }

  /**
   * @param {function} callback
   */
  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  /**
   * @param {function} callback
   */
  addErrorListener(callback) {
    this.on(ERROR_EVENT, callback);
  }

  /**
   * @param {function} callback
   */
  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  /**
   * @param {function} callback
   */
  removeErrorListener(callback) {
    this.removeListener(ERROR_EVENT, callback);
  }

  getAppSortList() {
    return appSortList;
  }
}

let launcherStore = new LauncherStore();
export default launcherStore;

function mergeSortList(list) {
  FSAPI.readFile(APPSORT_FILE, {
    encoding: 'utf8',
    onSuccess: function(data) {
      let i;
      let sortedList = JSON.parse(data);

      appSortList = [];

      // Build sorted app list dictionary
      let sortedDict = [];
      for (i in sortedList)
        sortedDict[sortedList[i]] = sortedList[i];

      // Build lastest app list dictionary
      let _newDict = [];
      for (i in list)
        _newDict[list[i].identifier] = list[i];

      // Insert existent apps to sorted app list
      for (i in sortedList) {
        if (_newDict[sortedList[i]]) {
          appSortList.push(_newDict[sortedList[i]]);
        }
        else {
          sortedList.splice(i, 1);
          sortedDict[sortedList[i]] = undefined;
        }
      }

      // Insert new apps to sorted app list
      for (i in list) {
        if (!sortedDict[list[i].identifier]) {
          sortedList.push(list[i].identifier);
          sortedDict[list[i].identifier] = list[i].identifier;
          appSortList.push(list[i]);
        }
      }

      launcherStore.emitChange({
        type: LauncherConstants.LAUNCHER_SORT_APP_LIST
      });
    },
    onError: function(error) {
      launcherStore.emitError({
        type: LauncherConstants.LAUNCHER_SORT_APP_LIST,
        msg: 'Unable to read APP list (' + error + ')'
      });
    }
  });
}

function writeSortList(list, actionType) {
  let ids = list.map(app => app.identifier);
  let appsort = JSON.stringify(ids, null, 4);

  FSAPI.writeFile(APPSORT_FILE, appsort, {
    onSuccess: function() {
      appSortList = list;
      launcherStore.emitChange({ type: actionType });
    },
    onError: function(error) {
      launcherStore.emitError({
        type: actionType,
        msg: 'Unable to write APP list'
      });
    }
  });
}

function removeAppFromSortList(manifest) {
  /* Remove manifest from appSortList */
  for (let i = 0, len = appSortList.length; i < len; i++) {
    if (appSortList[i].identifier === manifest.identifier) {
      appSortList.splice(i, 1);
      break;
    }
  }

  /* Update appsort.json */
  let ids = appSortList.map(app => app.identifier);
  let appsort = JSON.stringify(appSortList, null, 4);
  FSAPI.writeFile(APPSORT_FILE, appsort, {
    onSuccess: function() {
      launcherStore.emitChange({
        type: LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST
      });
    },
    onError: function(error) {
      launcherStore.emitError({
        type: LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST,
        msg: 'Unable to write APP list'
      });
    }
  });
}

LauncherDispatcher.register((action) => {
  switch (action.actionType) {
    case LauncherConstants.LAUNCHER_SORT_APP_LIST:
      FSAPI.exist(APPSORT_FILE, {
        onSuccess: function(exist) {
          if (exist)
            mergeSortList(action.list);
          else
            writeSortList(action.list, action.actionType);
        }
      });
      break;
    case LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST:
      removeAppFromSortList(action.manifest);
      break;
    case LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST:
      writeSortList(action.list, action.actionType);
      break;
    case LauncherConstants.LAUNCHER_ENTER_MANAGE_MODE:
      launcherStore.emitChange({ type: action.actionType });
      break;
    case LauncherConstants.LAUNCHER_LEAVE_MANAGE_MODE:
      launcherStore.emitChange({ type: action.actionType });
      break;
    case LauncherConstants.LAUNCHER_MOVE_APP_ICON:
      launcherStore.emitChange({
        type: action.actionType,
        manifest: action.manifest,
        start: action.start,
        end: action.end
      });
  }
});
