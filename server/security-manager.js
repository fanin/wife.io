var fs = require('fs-extra');
var SYSTEM = require('../system');

module.exports = SecurityManager;

function SecurityManager(appInfo) {
    this.appInfo = appInfo;
    this.userDataDirectory = './apps/' + appInfo.Directory + '/userdata';

    if (!fs.existsSync(this.userDataDirectory))
        fs.mkdirSync(this.userDataDirectory);
}

SecurityManager.prototype.getUserDataPath = function(path) {
    return this.userDataDirectory + '/' + path;
}

SecurityManager.prototype.isExtensionAllowed = function(name) {
    for (var i in this.appInfo.Extensions) {
        if (this.appInfo.Extensions[i] == name)
            return true;
    }
    return false;
}

SecurityManager.prototype.isAppManageable = function() {
    if (this.appInfo.Directory === 'launcher' || this.appInfo.Directory === 'installer')
        return true;
    else
        return false;
}
