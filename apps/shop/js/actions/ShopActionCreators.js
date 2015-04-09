var ShopDispatcher         = require('../dispatcher/ShopDispatcher');
var ShopConstants          = require('../constants/ShopConstants');

var ShopActionCreators = {

    offlineAppList: function() {

    },

    offlineAppInstall: function(appBundleFile) {
        var size = 0;

        ShopDispatcher.dispatch({
            actionType: ShopConstants.SHOP_APP_INSTALL
        });

        // Upload appBundle to the server.
        return DiligentAgent.getClient().appManager.install(
            appBundleFile,
            function(instid, progress) {
                /* Handle 'Uploading' */
                ShopDispatcher.dispatch({
                    actionType: ShopConstants.SHOP_APP_STATE_UPLOADING,
                    instid: instid,
                    progress: progress
                });
            }, function(instid) {
                /* Handle 'Installing' */
                ShopDispatcher.dispatch({
                    actionType: ShopConstants.SHOP_APP_STATE_INSTALLING,
                    instid: instid
                });
            }, function(instid, error) {
                /* Handle 'Complete' */
                if (error) {
                    ShopDispatcher.dispatch({
                        actionType: ShopConstants.SHOP_APP_INSTALL_FAIL,
                        instid: instid,
                        error: error
                    });
                }
                else {
                    ShopDispatcher.dispatch({
                        actionType: ShopConstants.SHOP_APP_INSTALL_SUCCESS,
                        instid: instid
                    });
                }
            });
    },

    offlineAppCancelInstall: function(instid) {
        ShopDispatcher.dispatch({
            actionType: ShopConstants.SHOP_APP_CANCEL_INSTALL,
            instid: instid
        });

        return DiligentAgent.getClient().appManager.cancelInstall(instid, function(instid, error) {
            if (error) {
                ShopDispatcher.dispatch({
                    actionType: ShopConstants.SHOP_APP_CANCEL_INSTALL_FAIL,
                    instid: instid
                });
            }
            else {
                ShopDispatcher.dispatch({
                    actionType: ShopConstants.SHOP_APP_CANCEL_INSTALL_SUCCESS,
                    instid: instid
                });
            }
        });
    }
}

module.exports = ShopActionCreators;
