var ShopDispatcher         = require('../dispatcher/ShopDispatcher');
var ShopConstants          = require('../constants/ShopConstants');
var DiligentActionCreators = DiligentAgent.actions;

var ShopActions = {
    /**
     * Extension support
     */
    /* Uncomment this to support loading extension
    loadExtension: function() {
        DiligentActionCreators.loadExtension(YOUR_EXTENSION);
    },
    */

    /* Uncomment this to support unloading extension
    unloadExtension: function() {
        DiligentActionCreators.unloadExtension(YOUR_EXTENSION);
    }
    */

    offlineAppList: function() {

    },

    offlineAppInstall: function(appBundleFile) {
        var size = 0;

        ShopDispatcher.dispatch({
            actionType: ShopConstants.SHOP_APP_INSTALL
        });

        // Upload appBundle to the server.
        return AppManagerClient.install(appBundleFile, function(instid, progress) {
            ShopDispatcher.dispatch({
                actionType: ShopConstants.SHOP_APP_INSTALL_PROGRESS,
                instid: instid,
                progress: progress
            });
        });
    },

    offlineAppCancelInstall: function(instid) {
        ShopDispatcher.dispatch({
            actionType: ShopConstants.SHOP_APP_CANCEL_INSTALL,
            instid: instid
        });

        return AppManagerClient.cancelInstall(instid);
    }
}

module.exports = ShopActions;

function onAppUploading(arg) {
    ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_STATE_UPLOADING,
        instid: arg.instid
    });
}

function onAppInstalling(arg) {
    ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_STATE_INSTALLING,
        instid: arg.instid
    });
}

function onAppInstallSuccess(arg) {
    ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_INSTALL_SUCCESS,
        instid: arg.instid
    });
}

function onAppInstallFail(arg) {
    ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_INSTALL_FAIL,
        instid: arg.instid,
        error: arg.error
    });
}

function onAppCancelInstallSuccess(arg) {
    ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_CANCEL_INSTALL_SUCCESS,
        instid: arg.instid
    });
}

function onAppCancelInstallFail(arg) {
    ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_CANCEL_INSTALL_FAIL,
        instid: arg.instid
    });
}

AppManagerClient.on("app.install#uploading", onAppUploading);
AppManagerClient.on("app.install#installing", onAppInstalling);
AppManagerClient.on("app.install#success", onAppInstallSuccess);
AppManagerClient.on("app.install#error", onAppInstallFail);
AppManagerClient.on("app.install#cancelled", onAppCancelInstallSuccess);
AppManagerClient.on("app.install#cancel-error", onAppCancelInstallFail);
