import LauncherDispatcher from '../dispatcher/LauncherDispatcher';
import LauncherConstants  from '../constants/LauncherConstants';

export default {
  sortAppList: (list) => {
    LauncherDispatcher.dispatch({
      actionType: LauncherConstants.LAUNCHER_SORT_APP_LIST,
      list: list
    });
  },

  writeSortedAppList: (list) => {
    LauncherDispatcher.dispatch({
      actionType: LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST,
      list: list
    });
  },

  removeAppFromSortList: (manifest) => {
    LauncherDispatcher.dispatch({
      actionType: LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST,
      manifest: manifest
    });
  },

  manageApps: (b) => {
    if (b)
      LauncherDispatcher.dispatch({
        actionType: LauncherConstants.LAUNCHER_ENTER_MANAGE_MODE
      });
    else
      LauncherDispatcher.dispatch({
        actionType: LauncherConstants.LAUNCHER_LEAVE_MANAGE_MODE
      });
  }
}
