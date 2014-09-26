var fs = require('fs-extra'),
    path = require('path'),
    AdmZip = require('adm-zip');

var SYSTEM = require('../system');
var AppPath = path.resolve(__dirname, '../apps');
var AppInfoFile = 'AppInfo.json';

module.exports = AppManager;

function AppManager() {
    var self = this;

    this.verifyAppInfo = function(appInfo) {
        if (appInfo.AppName === undefined)
            return false;
        if (appInfo.Version === undefined)
            return false;
        if (appInfo.ProtocolVersion === undefined)
            return false;
        if (appInfo.Directory === undefined)
            return false;
        if (appInfo.AppEntry === undefined)
            return false;
        if (appInfo.ShowInLauncher === undefined)
            return false;
        return true;
    };

    this.verifyAppBundle = function(appBundle) {
        var appInfo = null;
        var appDirs = [];

        try {
            appBundle.getEntries().every(function(zipEntry, index, zipEntries) {
                if (zipEntry.isDirectory)
                    appDirs.push(path.join(zipEntry.entryName, '.'));
                else if (path.basename(zipEntry.entryName) == AppInfoFile) {
                    try {
                        var info = JSON.parse(appBundle.readAsText(zipEntry, 'ascii'));
                        if (self.verifyAppInfo(info)) {
                            if (appBundle.getEntry(info.Directory + '/' + info.AppEntry)) {
                                if (appDirs.indexOf(info.Directory) >= 0) {
                                    appInfo = info;
                                    return false;
                                }
                            }
                        }
                    }
                    catch (err) { console.log(err); }
                    return false;
                }

                return true;
            });
        }
        catch (err) { console.log(err); }

        return appInfo;
    };

    this.buildUserAppSymlink = function(directory) {
        fs.symlinkSync(SYSTEM.SETTINGS.UserAppPath + '/' + directory, AppPath + '/' + directory);
    };

    this.destroyUserAppSymlink = function(directory) {
        if (fs.existsSync(AppPath + '/' + directory))
            fs.unlinkSync(AppPath + '/' + directory);
    };

    this.rebuildUserAppsSymlink = function() {
        try {
            var appList = fs.readdirSync(AppPath).filter(function (file) {
                var currAppPath = AppPath + '/' + file;
                var stat = fs.lstatSync(currAppPath);
                if (stat.isDirectory() || stat.isSymbolicLink())
                    if (fs.existsSync(currAppPath + '/' + AppInfoFile))
                        return true;
                return false;
            });

            var userAppList = fs.readdirSync(SYSTEM.SETTINGS.UserAppPath).filter(function (file) {
                var currUserAppPath = SYSTEM.SETTINGS.UserAppPath + '/' + file;
                var stat = fs.lstatSync(currUserAppPath);
                if (stat.isDirectory() || stat.isSymbolicLink())
                    if (fs.existsSync(currUserAppPath + '/' + AppInfoFile))
                        return true;
                return false;
            });

            for (var i in appList) {
                var currAppPath = AppPath + '/' + appList[i];
                var stat = fs.lstatSync(currAppPath);
                if (stat.isSymbolicLink())
                    if (!fs.existsSync(fs.readlinkSync(currAppPath))) {
                        /* Destroy symbolic links of removed APPs */
                        self.destroyUserAppSymlink(appList[i]);
                    }
            }

            for (i in userAppList) {
                if (appList.indexOf(userAppList[i]) < 0) {
                    /* Rebuild symbolic links for existing APPs */
                    self.buildUserAppSymlink(userAppList[i]);
                }
            }
        }
        catch (err) { console.log(err); }
    };

    this.loadApps = function(path, list) {
        var builtinApps = [];
        var userApps = [];

        for (var i in list) {
            var stat = fs.lstatSync(path + '/' + list[i]);
            var jsonAppInfo = fs.readFileSync(path + '/' + list[i] + '/' + AppInfoFile);
            if (jsonAppInfo) {
                try {
                    var appInfo = JSON.parse(jsonAppInfo);
                    if (this.verifyAppInfo(appInfo)) {
                        if (stat.isSymbolicLink())
                            userApps.push(appInfo);
                        else
                            builtinApps.push(appInfo);
                    }
                    else
                        console.log('App verify failed (' + list[i] + ')');
                }
                catch (err) {
                    console.log('Bad app info format (' + list[i] + ')');
                }
            }
        }

        return { builtin: builtinApps, user: userApps };
    };

    /* Create user app path if not exist */
    if (!fs.existsSync(SYSTEM.SETTINGS.UserAppPath)) {
        var dirs = SYSTEM.SETTINGS.UserAppPath.split('/');
        var p = '';

        /* Remove first '/' */
        dirs.shift();

        for (var i in dirs) {
            p += '/' + dirs[i];
            if (!fs.existsSync(p))
                fs.mkdirSync(p);
        }
    }

    /* Check user app symbolic links at startup time */
    this.rebuildUserAppsSymlink();
}

AppManager.prototype.listApps = function() {
    try {
        var appList = fs.readdirSync(AppPath).filter(function (file) {
            var stat = fs.lstatSync(AppPath + '/' + file);
            if (stat.isDirectory() || stat.isSymbolicLink())
                if (fs.existsSync(AppPath + '/' + file + '/' + AppInfoFile))
                    return true;
            return false;
        });

        return this.loadApps(AppPath, appList);
    }
    catch (err) { console.log(err); }
}

AppManager.prototype.install = function(appBundlePath) {
    var appBundle;
    var appInfo;

    if (!fs.existsSync(appBundlePath))
        return { result: 'ERROR-NOT-EXIST' };

    try {
        appBundle = new AdmZip(appBundlePath);
    }
    catch (err) {
        return { result: 'ERROR-BAD-FORMAT' };
    }

    appInfo = this.verifyAppBundle(appBundle);
    if (!appInfo)
        return { result: 'ERROR-BAD-FILE-STRUCT' };

    try {
        appBundle.extractAllTo(SYSTEM.SETTINGS.UserAppPath, true);
    }
    catch (err) {
        return { result: 'ERROR-UNZIP-FAIL' };
    }

    try {
        /* Remove existing APP symbolic link */
        this.destroyUserAppSymlink(appInfo.Directory);

        /* Build APP symbolic link */
        this.buildUserAppSymlink(appInfo.Directory);
    }
    catch (err) {
        console.log(err);
        return { result: 'ERROR-UNLINK-SYMLINK' };
    }

    return { result: 'OK' };
}

AppManager.prototype.uninstall = function(appDirectory) {
    var appPath = SYSTEM.SETTINGS.UserAppPath + '/' + appDirectory;

    if (!fs.existsSync(appPath))
        return { result: 'ERROR-NOT-EXIST' };

    try {
        /* Remove APP symbolic link */
        this.destroyUserAppSymlink(appDirectory);

        /* Remove APP in user storage */
        fs.removeSync(appPath);
    }
    catch (err) {
        console.log(err);
        return { result: 'ERROR-FS-REMOVE' };
    }

    return { result: 'OK' };
}
