var LauncherDispatcher = require('../dispatcher/LauncherDispatcher');
var LauncherConstants  = require('../constants/LauncherConstants');

var LauncherActionCreators = {

    listApps: function() {
        DiligentAgent.getClient().appManager.list(function(list) {
            LauncherDispatcher.dispatch({
                actionType: LauncherConstants.LAUNCHER_APP_LIST,
                list: list
            });
        });
    },

    removeApp: function(manifest) {
        DiligentAgent.getClient().appManager.uninstall(manifest, function(manifest, error) {
            if (error) {
                LauncherDispatcher.dispatch({
                    actionType: LauncherConstants.LAUNCHER_APP_UNINSTALL_FAIL,
                    error: error
                });
            }
            else {
                LauncherDispatcher.dispatch({
                    actionType: LauncherConstants.LAUNCHER_APP_UNINSTALL_SUCCESS,
                    manifest: manifest
                });
            }
        });

        LauncherDispatcher.dispatch({
            actionType: LauncherConstants.LAUNCHER_APP_UNINSTALL,
            manifest: manifest
        });
    },

    writeAppList: function(list) {
        LauncherDispatcher.dispatch({
            actionType: LauncherConstants.LAUNCHER_APP_WRITE_SORT_LIST,
            list: list
        });
    },

    manageApps: function(b) {
        if (b)
            LauncherDispatcher.dispatch({
                actionType: LauncherConstants.LAUNCHER_APP_ENTER_MANAGE_MODE
            });
        else
            LauncherDispatcher.dispatch({
                actionType: LauncherConstants.LAUNCHER_APP_LEAVE_MANAGE_MODE
            });
    }
}

module.exports = LauncherActionCreators;
