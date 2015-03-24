var LauncherDispatcher = require('../dispatcher/LauncherDispatcher');
var LauncherConstants  = require('../constants/LauncherConstants');

function onAppList(arg) {
    LauncherDispatcher.dispatch({
        actionType: LauncherConstants.LAUNCHER_APP_LIST,
        list: arg.list
    });
}

function onAppUninstallSuccess(arg) {
    LauncherDispatcher.dispatch({
        actionType: LauncherConstants.LAUNCHER_APP_UNINSTALL_SUCCESS,
        manifest: arg.manifest
    });
}

function onAppUninstallFail(arg) {
    LauncherDispatcher.dispatch({
        actionType: LauncherConstants.LAUNCHER_APP_UNINSTALL_FAIL,
        error: arg.error
    });
}

AppManagerClient.on("app.list", onAppList);
AppManagerClient.on("app.uninstall#success", onAppUninstallSuccess);
AppManagerClient.on("app.uninstall#error", onAppUninstallFail);

var LauncherActions = {
    listApps: function() {
        AppManagerClient.list();
    },

    removeApp: function(manifest) {
        AppManagerClient.uninstall(manifest);

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

module.exports = LauncherActions;
