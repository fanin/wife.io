"use strict";

var path   = require('path');
var SYSTEM = require('../system');

module.exports = SecurityManager;

function SecurityManager(_super) {
    this.appInfo = [];
}

SecurityManager.prototype.register = function(socket, appInfo, complete) {
    this.appInfo[socket] = appInfo;
    complete && complete();
}

SecurityManager.prototype.unregister = function(socket) {
    this.appInfo[socket] = undefined;
}

SecurityManager.prototype.isExtensionAllowed = function(socket, name) {
    if (!this.appInfo[socket])
        return false;

    for (var i in this.appInfo[socket].Extensions) {
        if (this.appInfo[socket].Extensions[i] === name)
            return true;
    }
    return false;
}

SecurityManager.prototype.canManageApps = function(socket) {
    if (!this.appInfo[socket])
        return false;

    if (this.appInfo[socket].Directory === 'launcher' || this.appInfo[socket].Directory === 'installer')
        return true;
    else
        return false;
}

SecurityManager.prototype.appUserDataDirectory = function(socket) {
    if (!this.appInfo[socket])
        return '';
    return path.normalize('/' + SYSTEM.SETTINGS.SystemName.replace(/\s/g, '').toLocaleLowerCase() +
                          '/apps/' + this.appInfo[socket].Directory + '/userdata');
}

SecurityManager.prototype.isExternalUserDataAllowed = function(socket) {
    if (!this.appInfo[socket])
        return false;
    return this.appInfo[socket].AllowExternalUserData;
}
