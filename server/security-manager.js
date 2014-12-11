var SYSTEM = require('../system');

module.exports = SecurityManager;

function SecurityManager(_super, appInfo) {
    this.appInfo = appInfo;
}

SecurityManager.prototype.isExtensionAllowed = function(name) {
    for (var i in this.appInfo.Extensions) {
        if (this.appInfo.Extensions[i] === name)
            return true;
    }
    return false;
}

SecurityManager.prototype.canManageApps = function() {
    if (this.appInfo.Directory === 'launcher' || this.appInfo.Directory === 'installer')
        return true;
    else
        return false;
}

SecurityManager.prototype.appUserDataDirectory = function() {
    return '/' + SYSTEM.SETTINGS.SysName.replace(/\s/g, '').toLocaleLowerCase()
               + '/apps/' + this.appInfo.Directory + '/userdata';
}

SecurityManager.prototype.isExternalUserDataAllowed = function() {
    return this.appInfo.AllowExternalUserData;
}
