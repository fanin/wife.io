'use strict';

var assign                   = require('object-assign');
var EventEmitter             = require('events').EventEmitter;
var AppManagerActionCreators = require('../actions/AppManagerActionCreators');
var AppManagerConstants      = require('../constants/AppManagerConstants');
var AppManagerDispatcher     = require('../dispatcher/AppManagerDispatcher');
var AppManagerStore          = require('../stores/AppManagerStore');

var AppManagerAgent = assign({}, EventEmitter.prototype, {
    init: function() {
        AppManagerStore.addChangeListener(this._onAppManagerChange);
    },

    deinit: function() {
        AppManagerStore.removeChangeListener(this._onAppManagerChange);
    },

    _onAppManagerChange: function(change) {
        switch (change.actionType) {
            case AppManagerConstants.APP_MANAGER_LIST:
                AppManagerAgent.emit('app.listDidReceive', AppManagerStore.getApps());
                break;
            case AppManagerConstants.APP_MANAGER_INSTALL:
                AppManagerAgent.emit('app.willInstall', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_INSTALL_UPLOADING:
                AppManagerAgent.emit('app.isUploading', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_INSTALL_INSTALLING:
                AppManagerAgent.emit('app.isInstalling', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_INSTALL_SUCCESS:
                AppManagerAgent.emit('app.didInstall', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_INSTALL_FAIL:
                AppManagerAgent.emit('app.installDidFail', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_CANCEL_INSTALL:
                AppManagerAgent.emit('app.willCancelInstall', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_CANCEL_INSTALL_SUCCESS:
                AppManagerAgent.emit('app.didCancelInstall', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_CANCEL_INSTALL_FAIL:
                AppManagerAgent.emit('app.cancelInstallDidFail', AppManagerStore.getInstallInfo(change.instid));
                break;
            case AppManagerConstants.APP_MANAGER_UNINSTALL:
                AppManagerAgent.emit('app.willUninstall', AppManagerStore.getUninstallInfo(change.manifest.identifier));
                break;
            case AppManagerConstants.APP_MANAGER_UNINSTALL_SUCCESS:
                AppManagerAgent.emit('app.didUninstall', AppManagerStore.getUninstallInfo(change.manifest.identifier));
                break;
            case AppManagerConstants.APP_MANAGER_UNINSTALL_FAIL:
                AppManagerAgent.emit('app.uninstallDidFail', AppManagerStore.getUninstallInfo(change.manifest.identifier));
                break;
        }
    },

    attach: function(component) {
        if (component.appListDidReceive)
            AppManagerAgent.on('app.listDidReceive', component.appListDidReceive);
        if (component.appWillInstall)
            AppManagerAgent.on('app.willInstall', component.appWillInstall);
        if (component.appIsUploading)
            AppManagerAgent.on('app.isUploading', component.appIsUploading);
        if (component.appIsInstalling)
            AppManagerAgent.on('app.isInstalling', component.appIsInstalling);
        if (component.appDidInstall)
            AppManagerAgent.on('app.didInstall', component.appDidInstall);
        if (component.appInstallDidFail)
            AppManagerAgent.on('app.installDidFail', component.appInstallDidFail);
        if (component.appWillCancelInstall)
            AppManagerAgent.on('app.willCancelInstall', component.appWillCancelInstall);
        if (component.appDidCancelInstall)
            AppManagerAgent.on('app.didCancelInstall', component.appDidCancelInstall);
        if (component.appCancelInstallDidFail)
            AppManagerAgent.on('app.cancelInstallDidFail', component.appCancelInstallDidFail);
        if (component.appWillUninstall)
            AppManagerAgent.on('app.willUninstall', component.appWillUninstall);
        if (component.appDidUninstall)
            AppManagerAgent.on('app.didUninstall', component.appDidUninstall);
        if (component.appUninstallDidFail)
            AppManagerAgent.on('app.uninstallDidFail', component.appUninstallDidFail);
    },

    detach: function(component) {
        if (component.appListDidReceive)
            AppManagerAgent.off('app.listDidReceive', component.appListDidReceive);
        if (component.appWillInstall)
            AppManagerAgent.off('app.willInstall', component.appWillInstall);
        if (component.appIsUploading)
            AppManagerAgent.off('app.isUploading', component.appIsUploading);
        if (component.appIsInstalling)
            AppManagerAgent.off('app.isInstalling', component.appIsInstalling);
        if (component.appDidInstall)
            AppManagerAgent.off('app.didInstall', component.appDidInstall);
        if (component.appInstallDidFail)
            AppManagerAgent.off('app.installDidFail', component.appInstallDidFail);
        if (component.appWillCancelInstall)
            AppManagerAgent.off('app.willCancelInstall', component.appWillCancelInstall);
        if (component.appDidCancelInstall)
            AppManagerAgent.off('app.didCancelInstall', component.appDidCancelInstall);
        if (component.appCancelInstallDidFail)
            AppManagerAgent.off('app.cancelInstallDidFail', component.appCancelInstallDidFail);
        if (component.appWillUninstall)
            AppManagerAgent.off('app.willUninstall', component.appWillUninstall);
        if (component.appDidUninstall)
            AppManagerAgent.off('app.didUninstall', component.appDidUninstall);
        if (component.appUninstallDidFail)
            AppManagerAgent.off('app.uninstallDidFail', component.appUninstallDidFail);
    },

    list: function() {
        AppManagerActionCreators.list();
    },

    install: function(appBundleFile) {
        return AppManagerActionCreators.install(appBundleFile);
    },

    cancelInstall: function(instid) {
        AppManagerActionCreators.cancelInstall(instid);
    },

    uninstall: function(manifest) {
        AppManagerActionCreators.uninstall(manifest);
    },

    getAppManifest: function(directory) {
        return AppManagerStore.getAppManifest(directory);
    },

    getAppType: function(manifest) {
        return AppManagerStore.getAppType(manifest);
    }
});

module.exports = AppManagerAgent;
