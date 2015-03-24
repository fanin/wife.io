"use strict";

var path   = require('path');
var SYSTEM = require('../system');

module.exports = SecurityManager;

function SecurityManager(_super) {
    this.manifests = [];
}

SecurityManager.prototype.register = function(socket, manifest, complete) {
    this.manifests[socket] = manifest;
    complete && complete();
}

SecurityManager.prototype.unregister = function(socket) {
    this.manifests[socket] = undefined;
}

SecurityManager.prototype.isExtensionAllowed = function(socket, name) {
    if (!this.manifests[socket])
        return false;

    for (var i in this.manifests[socket].extensions) {
        if (this.manifests[socket].extensions[i] === name)
            return true;
    }
    return false;
}

SecurityManager.prototype.canManageApps = function(socket) {
    if (!this.manifests[socket])
        return false;

    if (this.manifests[socket].directory === 'launcher' || this.manifests[socket].directory === 'shop')
        return true;
    else
        return false;
}

SecurityManager.prototype.appUserDataDirectory = function(socket) {
    if (!this.manifests[socket])
        return '';
    return path.normalize('/' + SYSTEM.SETTINGS.SystemName.replace(/\s/g, '').toLocaleLowerCase() +
                          '/apps/' + this.manifests[socket].directory + '/userdata');
}

SecurityManager.prototype.isExternalUserDataAllowed = function(socket) {
    if (!this.manifests[socket])
        return false;
    return this.manifests[socket].allow_external_userdata;
}
