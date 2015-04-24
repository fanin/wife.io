var AppManagerDispatcher = require('../dispatcher/AppManagerDispatcher');
var AppManagerConstants  = require('../constants/AppManagerConstants');
var EventEmitter         = require('events').EventEmitter;
var assign               = require('object-assign');

var CHANGE_EVENT = 'APP_MANAGER_STORE_CHANGE';

var appList = [];
var instInfo = [];
var uninstInfo = [];

var AppManagerStore = assign({}, EventEmitter.prototype, {
    emitChange: function(changes) {
        this.emit(CHANGE_EVENT, changes);
    },

    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getApps: function() {
        return appList;
    },

    getInstallInfo: function(instid) {
        return instInfo[instid];
    },

    getUninstallInfo: function(appId) {
        return uninstInfo[appId];
    },

    getAppManifest: function(directory) {
        for (var key in appList)
            if (appList[key].directory === directory)
                return appList[key];
        return null;
    },

    getAppType: function(manifest) {
        return DiligentAgent.getClient().appManager.getType(manifest);
    }
});

AppManagerStore.dispatchToken = AppManagerDispatcher.register(function(action) {
    switch (action.actionType) {
        case AppManagerConstants.APP_MANAGER_LIST:
            appList = action.list;
            AppManagerStore.emitChange({ actionType: action.actionType });
            break;
        case AppManagerConstants.APP_MANAGER_INSTALL:
            instInfo[action.instid] = {
                progress: 0
            };
            AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            break;
        case AppManagerConstants.APP_MANAGER_INSTALL_UPLOADING:
            if (instInfo[action.instid]) {
                instInfo[action.instid].progress = action.progress;
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_INSTALL_INSTALLING:
            if (instInfo[action.instid]) {
                instInfo[action.instid].progress = 100;
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_INSTALL_SUCCESS:
            if (instInfo[action.instid]) {
                instInfo[action.instid].progress = 100;
                instInfo[action.instid].manifest = action.manifest;
                appList.push(action.manifest);
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_INSTALL_FAIL:
            if (instInfo[action.instid]) {
                instInfo[action.instid].error = action.error;
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_CANCEL_INSTALL:
            if (instInfo[action.instid]) {
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_CANCEL_INSTALL_SUCCESS:
            if (instInfo[action.instid]) {
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_CANCEL_INSTALL_FAIL:
            if (instInfo[action.instid]) {
                instInfo[action.instid].error = action.error;
                AppManagerStore.emitChange({ actionType: action.actionType, instid: action.instid });
            }
            break;
        case AppManagerConstants.APP_MANAGER_UNINSTALL:
            uninstInfo[action.manifest.identifier] = {
                manifest: action.manifest
            };
            AppManagerStore.emitChange({ actionType: action.actionType, manifest: action.manifest });
            break;
        case AppManagerConstants.APP_MANAGER_UNINSTALL_SUCCESS:
            if (uninstInfo[action.manifest.identifier]) {
                for (var i in appList) {
                    if (appList[i].identifier === action.manifest.identifier) {
                        appList.splice(i, 1);
                        break;
                    }
                }
                AppManagerStore.emitChange({ actionType: action.actionType, manifest: action.manifest });
            }
            break;
        case AppManagerConstants.APP_MANAGER_UNINSTALL_FAIL:
            if (uninstInfo[action.manifest.identifier]) {
                uninstInfo[action.manifest.identifier].error = action.error;
                AppManagerStore.emitChange({ actionType: action.actionType, manifest: action.manifest });
            }
            break;
    }
});

module.exports = AppManagerStore;
