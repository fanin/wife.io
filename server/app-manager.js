var fs = require('fs-extra'),
    ss = require('socket.io-stream'),
    path = require('path'),
    randomstring = require('./lib/randomstring'),
    AdmZip = require('adm-zip');

var SYSTEM = require('../system');
var AppPath = path.resolve(__dirname, '../apps');
var AppInfoFile = 'AppInfo.json';

module.exports = AppManager;

function AppManager() {
    var self = this;

    /* Maintain a 'AppIdentifier:AppInfo' dictionary array for all Apps */
    this.apps = [];

    /* Private methods */
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

    this.buildAppSymlink = function(directory) {
        fs.symlinkSync(SYSTEM.SETTINGS.UserAppPath + '/' + directory, AppPath + '/' + directory);
    };

    this.destroyAppSymlink = function(directory) {
        if (fs.existsSync(AppPath + '/' + directory)) {
            fs.unlinkSync(AppPath + '/' + directory);
        }
    };

    this.rebuildAppsSymlink = function() {
        try {
            var appList = fs.readdirSync(AppPath).filter(function (file) {
                if (file.lastIndexOf('.backup') == (file.length - '.backup'.length))
                    return false;

                var currAppPath = AppPath + '/' + file;
                var stat = fs.lstatSync(currAppPath);
                if (stat.isDirectory() || stat.isSymbolicLink())
                    if (fs.existsSync(currAppPath + '/' + AppInfoFile))
                        return true;
                return false;
            });

            var userAppList = fs.readdirSync(SYSTEM.SETTINGS.UserAppPath).filter(function (file) {
                if (file.lastIndexOf('.backup') == (file.length - '.backup'.length))
                    return false;

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
                        self.destroyAppSymlink(appList[i]);
                    }
            }

            for (i in userAppList) {
                if (appList.indexOf(userAppList[i]) < 0) {
                    /* Rebuild symbolic links for existing APPs */
                    self.buildAppSymlink(userAppList[i]);
                }
            }
        }
        catch (err) { console.log(err); }
    };

    this.loadApps = function(path, list) {
        var builtinApps = [];
        var userApps = [];

        this.apps = [];

        for (var i in list) {
            var stat = fs.lstatSync(path + '/' + list[i]);
            var jsonAppInfo = fs.readFileSync(path + '/' + list[i] + '/' + AppInfoFile);
            if (jsonAppInfo) {
                try {
                    var appInfo = JSON.parse(jsonAppInfo);
                    if (this.verifyAppInfo(appInfo)) {
                        if (stat.isSymbolicLink()) {
                            if (appInfo.AppIdentifier) {
                                this.apps[appInfo.AppIdentifier] = appInfo;

                                /* Do not export AppIdentifier digits to client and preserve app type only */
                                appInfo.AppIdentifier = 'UAPP00000000';
                                userApps.push(appInfo);
                            }
                            else
                                console.log('Invalid App: No identifier');
                        }
                        else {
                            /* FIXME: Builtin App Indentifier should be generated at build time */
                            /* Generate builtin APPs indentifier for first time running */
                            if (appInfo.AppIdentifier === undefined) {
                                appInfo.AppIdentifier = randomstring.generate('BAPPXXXXXXXX');
                                fs.writeJsonSync(path + '/' + list[i] + '/' + AppInfoFile, appInfo);
                            }

                            this.apps[appInfo.AppIdentifier] = appInfo;

                            /* Do not export AppIdentifier digits to client and preserve app type only */
                            appInfo.AppIdentifier = 'BAPP00000000';
                            builtinApps.push(appInfo);
                        }
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
    this.rebuildAppsSymlink();
}

AppManager.prototype.register = function(_super, socket, protoAPP) {
    var self = this;
    var security = _super.securityManager[socket];

    /**
     * Protocol Listener: App Management Events
     */
    socket.on(protoAPP.List.REQ, function() {
        socket.emit(protoAPP.List.RES, self.listApps());
    });

    ss(socket).on(protoAPP.Install.REQ, function(appBundleDataStream) {
        if (!security.isAppManageable()) {
            socket.emit(protoAPP.Install.ERR, SYSTEM.ERROR.SecurityAccessDenied);
            return;
        }

        var installationCode = randomstring.generate('XXXXXXXX');
        var filename = SYSTEM.SETTINGS.TempPath + '/' + installationCode + '.zip';
        var appWriteStream = fs.createWriteStream(filename);
        self.appBundleDataStream = appBundleDataStream;
        appBundleDataStream.pipe(appWriteStream);

        appBundleDataStream.once('data', function() {
            socket.emit(protoAPP.Install.RES, installationCode, "Uploading");
        });

        appBundleDataStream.on('finish', function() {
            socket.emit(protoAPP.Install.RES, installationCode, "Installing");

            var result = self.install(filename).result;
            if (result === 'OK')
                socket.emit(protoAPP.Install.RES, installationCode, "Installed");
            else
                socket.emit(protoAPP.Install.ERR, result);

            appBundleDataStream.end();
            fs.removeSync(filename);
        });

        appBundleDataStream.on('error', function(err) {
            console.log('APP Install: ' + err);
            socket.emit(protoAPP.Install.ERR, SYSTEM.ERROR.FSBrokenPipe);
        });
    });

    socket.on(protoAPP.CancelInstall.REQ, function(installationCode) {
        if (!security.isAppManageable()) {
            socket.emit(protoAPP.CancelInstall.ERR, SYSTEM.ERROR.SecurityAccessDenied);
            return;
        }

        var filename = SYSTEM.SETTINGS.TempPath + '/' + installationCode + '.zip';

        if (fs.existsSync(filename))
            fs.removeSync(filename);

        if (self.appBundleDataStream) {
            self.appBundleDataStream.end();
            self.appBundleDataStream.removeAllListeners('finish');
            self.appBundleDataStream.removeAllListeners('error');
            self.appBundleDataStream = undefined;
        }

        socket.emit(protoAPP.CancelInstall.RES, installationCode);
    });

    socket.on(protoAPP.Uninstall.REQ, function(appInfo) {
        if (!security.isAppManageable()) {
            socket.emit(protoAPP.Uninstall.ERR, SYSTEM.ERROR.SecurityAccessDenied);
            return;
        }

        var result = self.uninstall(appInfo).result;
        if (result === 'OK')
            socket.emit(protoAPP.Uninstall.RES, appInfo);
        else
            socket.emit(protoAPP.Uninstall.ERR, result);
    });
}

AppManager.prototype.unregister = function(socket, protoAPP) {
    socket.removeAllListeners(protoAPP.List.REQ);
    socket.removeAllListeners(protoAPP.Install.REQ);
    socket.removeAllListeners(protoAPP.CancelInstall.REQ);
    socket.removeAllListeners(protoAPP.Uninstall.REQ);
}

AppManager.prototype.getAppInfo = function(appDirectory) {
    var file = AppPath + '/' + appDirectory + '/' + AppInfoFile;

    if (fs.existsSync(file)) {
        var appInfo = fs.readJsonSync(file);

        if (appInfo)
            return appInfo;
        else
            return SYSTEM.ERROR.FSIOError;
    }
    else
        return SYSTEM.ERROR.FSNotExist;
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
    var oldAppInfo;
    var upgradeOfficially = false;

    if (!fs.existsSync(appBundlePath))
        return { result: SYSTEM.ERROR.FSNotExist };

    try {
        appBundle = new AdmZip(appBundlePath);
    }
    catch (err) {
        return { result: SYSTEM.ERROR.APPBadFileFormat };
    }

    appInfo = this.verifyAppBundle(appBundle);
    if (!appInfo)
        return { result: SYSTEM.ERROR.APPBadContentStruct };

    var sysAppPath = AppPath + '/' + appInfo.Directory;
    var userAppPath = SYSTEM.SETTINGS.UserAppPath + '/' + appInfo.Directory;

    /* Extract APP bundle */
    try {
        appBundle.extractAllTo(SYSTEM.SETTINGS.TempPath, true);
    }
    catch (err) {
        return { result: SYSTEM.ERROR.APPExtractFail };
    }

    if (fs.existsSync(sysAppPath)) {
        /* Handle APP upgrade */
        var jsonAppInfo = fs.readFileSync(sysAppPath + '/' + AppInfoFile);
        oldAppInfo = JSON.parse(jsonAppInfo);

        if (appInfo.Directory != oldAppInfo.Directory)
            return { result: SYSTEM.ERROR.APPUpgradeFail };

        if (appInfo.AppIdentifier === undefined)
            appInfo.AppIdentifier = 'UAPP00000000';
        else if (appInfo.AppIdentifier == oldAppInfo.AppIdentifier)
            upgradeOfficially = true;

        if (appInfo.AppIdentifier.indexOf('BAPP') == 0) {
            /* Upgrade builtin APP */

            if (fs.existsSync(sysAppPath + '.backup'))
                fs.removeSync(sysAppPath);
            else
                fs.renameSync(sysAppPath, sysAppPath + '.backup');

            try {
                /* Install extracted APP */
                fs.renameSync(SYSTEM.SETTINGS.TempPath + '/' + appInfo.Directory, sysAppPath);
            }
            catch (error) {
                console.log(error);
                return { result: SYSTEM.ERROR.APPInstall };
            }

            /* Copy APP identifier if this is not an official upgrade */
            if (!upgradeOfficially) {
                appInfo.AppIdentifier = oldAppInfo.AppIdentifier;
                fs.writeJsonSync(sysAppPath + '/' + AppInfoFile, appInfo);
            }
        }
        else if (appInfo.AppIdentifier.indexOf('UAPP') == 0) {
            /* Upgrade user APP */

            if (upgradeOfficially) {
                /* We assume the official APP will work correctly, so no need to backup */
            }
            else {
                if (fs.existsSync(userAppPath + '.backup'))
                    fs.removeSync(userAppPath);
                else
                    fs.renameSync(userAppPath, userAppPath + '.backup');
            }

            try {
                /* Install extracted APP */
                fs.renameSync(SYSTEM.SETTINGS.TempPath + '/' + appInfo.Directory, userAppPath);

                /* Remove existing APP symbolic link */
                this.destroyAppSymlink(appInfo.Directory);

                /* Build APP symbolic link */
                this.buildAppSymlink(appInfo.Directory);
            }
            catch (error) {
                console.log(error);
                return { result: SYSTEM.ERROR.APPInstall };
            }

            /* Copy APP identifier if this is not an official upgrade */
            if (!upgradeOfficially) {
                appInfo.AppIdentifier = oldAppInfo.AppIdentifier;
                fs.writeJsonSync(userAppPath + '/' + AppInfoFile, appInfo);
            }
        }
        else {
            return { result: SYSTEM.ERROR.APPBadIdentifier };
        }
    }
    else {
        try {
            /* Install extracted APP */
            fs.renameSync(SYSTEM.SETTINGS.TempPath + '/' + appInfo.Directory, userAppPath);

            /* Remove existing APP symbolic link */
            this.destroyAppSymlink(appInfo.Directory);

            /* Build APP symbolic link */
            this.buildAppSymlink(appInfo.Directory);
        }
        catch (error) {
            console.log(error);
            return { result: SYSTEM.ERROR.APPInstall };
        }

        /* Generate user APP indentifier */
        if (appInfo.AppIdentifier === undefined) {
            while (1) {
                appInfo.AppIdentifier = randomstring.generate('UAPPXXXXXXXX');
                if (this.apps[appInfo.AppIdentifier])
                    continue;

                fs.writeJsonSync(userAppPath + '/' + AppInfoFile, appInfo);
                break;
            }
        }
    }

    return { result: 'OK' };
}

AppManager.prototype.uninstall = function(appInfo) {
    var appPath = SYSTEM.SETTINGS.UserAppPath + '/' + appInfo.Directory;

    if (!fs.existsSync(appPath))
        return { result: SYSTEM.ERROR.FSNotExist };

    try {
        /* Remove from app list */
        this.apps[appInfo.AppIdentifier] = undefined;

        /* Remove APP symbolic link */
        this.destroyAppSymlink(appInfo.Directory);

        /* Remove APP in user storage */
        fs.removeSync(appPath);
    }
    catch (err) {
        console.log(err);
        return { result: SYSTEM.ERROR.FSRemoveItem };
    }

    return { result: 'OK' };
}
