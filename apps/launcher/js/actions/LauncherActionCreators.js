var LauncherDispatcher = require('../dispatcher/LauncherDispatcher');
var LauncherConstants  = require('../constants/LauncherConstants');

var LauncherActionCreators = {
    sortAppList: function(list) {
        LauncherDispatcher.dispatch({
            actionType: LauncherConstants.LAUNCHER_SORT_APP_LIST,
            list: list
        });
    },

    writeSortedAppList: function(list) {
        LauncherDispatcher.dispatch({
            actionType: LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST,
            list: list
        });
    },

    removeAppFromSortList: function(manifest) {
        LauncherDispatcher.dispatch({
            actionType: LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST,
            manifest: manifest
        });
    },

    manageApps: function(b) {
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

module.exports = LauncherActionCreators;
