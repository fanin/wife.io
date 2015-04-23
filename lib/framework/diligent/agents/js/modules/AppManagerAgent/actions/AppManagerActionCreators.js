var AppManagerDispatcher = require('../dispatcher/AppManagerDispatcher');
var AppManagerConstants  = require('../constants/AppManagerConstants');

var AppManagerActionCreators = {
    list: function() {
        DiligentAgent.getClient().appManager.list(function(list) {
            AppManagerDispatcher.dispatch({
                actionType: AppManagerConstants.APP_MANAGER_LIST,
                list: list
            });
        });
    },

    install: function(appBundleFile) {
        var instid = DiligentAgent.getClient().appManager.install(
            appBundleFile,
            function(instid, progress) {
                /* Handle 'Uploading' */
                AppManagerDispatcher.dispatch({
                    actionType: AppManagerConstants.APP_MANAGER_INSTALL_UPLOADING,
                    instid: instid,
                    progress: progress
                });
            }, function(instid) {
                /* Handle 'Installing' */
                AppManagerDispatcher.dispatch({
                    actionType: AppManagerConstants.APP_MANAGER_INSTALL_INSTALLING,
                    instid: instid
                });
            }, function(instid, manifest, error) {
                /* Handle 'Complete' */
                if (error) {
                    AppManagerDispatcher.dispatch({
                        actionType: AppManagerConstants.APP_MANAGER_INSTALL_FAIL,
                        instid: instid,
                        error: error
                    });
                }
                else {
                    AppManagerDispatcher.dispatch({
                        actionType: AppManagerConstants.APP_MANAGER_INSTALL_SUCCESS,
                        instid: instid,
                        manifest: manifest
                    });
                }
            }
        );

        AppManagerDispatcher.dispatch({
            actionType: AppManagerConstants.APP_MANAGER_INSTALL,
            instid: instid
        });

        return instid;
    },

    cancelInstall: function(instid) {
        AppManagerDispatcher.dispatch({
            actionType: AppManagerConstants.APP_MANAGER_CANCEL_INSTALL,
            instid: instid
        });

        return DiligentAgent.getClient().appManager.cancelInstall(instid, function(instid, error) {
            if (error) {
                AppManagerDispatcher.dispatch({
                    actionType: AppManagerConstants.APP_MANAGER_CANCEL_INSTALL_FAIL,
                    instid: instid,
                    error: error
                });
            }
            else {
                AppManagerDispatcher.dispatch({
                    actionType: AppManagerConstants.APP_MANAGER_CANCEL_INSTALL_SUCCESS,
                    instid: instid
                });
            }
        });
    },

    uninstall: function(manifest) {
        AppManagerDispatcher.dispatch({
            actionType: AppManagerConstants.APP_MANAGER_UNINSTALL,
            manifest: manifest
        });

        DiligentAgent.getClient().appManager.uninstall(manifest, function(manifest, error) {
            if (error) {
                AppManagerDispatcher.dispatch({
                    actionType: AppManagerConstants.APP_MANAGER_UNINSTALL_FAIL,
                    manifest: manifest,
                    error: error
                });
            }
            else {
                AppManagerDispatcher.dispatch({
                    actionType: AppManagerConstants.APP_MANAGER_UNINSTALL_SUCCESS,
                    manifest: manifest
                });
            }
        });
    }
}

module.exports = AppManagerActionCreators;
