"use strict";

var fs           = require('fs-extra'),
    fse          = require('fs-extended'),
    ss           = require('socket.io-stream'),
    path         = require('path'),
    randomstring = require('./lib/randomstring'),
    AdmZip       = require('adm-zip');

fs.jsonfile.spaces = 4;

var SYSTEM           = require('../system');
var USER_APP_PATH    = SYSTEM.SETTINGS.SystemDataPath + path.sep + SYSTEM.SETTINGS.SystemName + path.sep + 'apps';
var BUILTIN_APP_PATH = path.resolve(__dirname, '..' + path.sep + 'apps');
var APP_INFO_FILE    = 'manifest.json';

module.exports = AppManager;

function AppManager(_super, apiSpec) {
    this._super = _super;
    this.APISpec = apiSpec;
    this.securityManager = _super.securityManager;

    /* Maintain a 'AppIdentifier:AppInfo' dictionary array for all Apps */
    this.apps = [];

    /* Private methods */
    this.verifyAppInfo = function(appInfo) {
        if (appInfo.AppName === undefined)
            return false;
        if (appInfo.Version === undefined)
            return false;
        if (appInfo.WSAPIVersion === undefined)
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
                else if (path.basename(zipEntry.entryName) === APP_INFO_FILE) {
                    try {
                        var info = JSON.parse(appBundle.readAsText(zipEntry, 'utf8'));
                        if (this.verifyAppInfo(info)) {
                            if (appBundle.getEntry(info.Directory + path.sep + info.AppEntry)) {
                                if (appDirs.indexOf(info.Directory) >= 0) {
                                    appInfo = info;
                                    return false;
                                }
                            }
                        }
                    }
                    catch (err) { console.log('Parse AppInfo Error: ' + err); }
                    return false;
                }

                return true;
            }.bind(this));
        }
        catch (err) { 'App Bundle Error: ' + console.log(err); }

        return appInfo;
    };

    this.loadApps = function(_path, list) {
        var appList = [];

        for (var i in list) {
            var jsonAppInfo = fs.readFileSync(_path + path.sep + list[i] + path.sep + APP_INFO_FILE);
            if (jsonAppInfo) {
                try {
                    var appInfo = JSON.parse(jsonAppInfo);
                    if (this.verifyAppInfo(appInfo)) {
                        if (_path === USER_APP_PATH) {
                            if (appInfo.AppIdentifier) {
                                this.apps[appInfo.AppIdentifier] = appInfo;

                                /* Erase AppIdentifier digits */
                                appInfo.AppIdentifier = 'UAPP00000000';
                                appList.push(appInfo);
                            }
                            else
                                console.log('Invalid App: No identifier');
                        }
                        else {
                            /* FIXME: Builtin App Indentifier should be generated at build time */
                            if (appInfo.AppIdentifier === undefined) {
                                /* Generate builtin APPs indentifier for first time running */
                                appInfo.AppIdentifier = randomstring.generate('BAPPXXXXXXXX');
                                fs.writeJsonSync(_path + path.sep + list[i] + path.sep + APP_INFO_FILE, appInfo);
                            }

                            this.apps[appInfo.AppIdentifier] = appInfo;

                            /* Erase AppIdentifier digits for security reason, we only return APP type 'BAPP/UAPP' to client */
                            appInfo.AppIdentifier = 'BAPP00000000';
                            appList.push(appInfo);
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

        return appList;
    };
}

AppManager.prototype.register = function(socket, complete) {
    var self = this;

    /**
     * Protocol Listener: App Management Events
     */
    socket.on(self.APISpec.List.REQ, function() {
        socket.emit(self.APISpec.List.RES, self.listApps());
    });

    ss(socket).on(self.APISpec.Install.REQ, function(appBundleDataStream) {
        if (!self.securityManager.canManageApps(socket)) {
            socket.emit(self.APISpec.Install.ERR, SYSTEM.ERROR.ERROR_SECURITY_ACCESS_DENIED);
            return;
        }

        var installationCode = randomstring.generate('XXXXXXXX');
        var filename = SYSTEM.SETTINGS.TempPath + path.sep + installationCode + '.zip';
        var appWriteStream = fs.createWriteStream(filename);
        self.appBundleDataStream = appBundleDataStream;
        appBundleDataStream.pipe(appWriteStream);

        appBundleDataStream.once('data', function() {
            socket.emit(self.APISpec.Install.RES, installationCode, "Uploading");
        });

        appBundleDataStream.on('finish', function() {
            socket.emit(self.APISpec.Install.RES, installationCode, "Installing");

            var result = self.install(filename).result;
            if (result === 'OK')
                socket.emit(self.APISpec.Install.RES, installationCode, "Installed");
            else
                socket.emit(self.APISpec.Install.ERR, result);

            appBundleDataStream.end();
            fs.removeSync(filename);
        });

        appBundleDataStream.on('error', function(err) {
            console.log('APP Install: ' + err);
            socket.emit(self.APISpec.Install.ERR, SYSTEM.ERROR.ERROR_FS_BROKEN_PIPE);
        });
    });

    socket.on(self.APISpec.CancelInstall.REQ, function(installationCode) {
        if (!self.securityManager.canManageApps(socket)) {
            socket.emit(self.APISpec.CancelInstall.ERR, SYSTEM.ERROR.ERROR_SECURITY_ACCESS_DENIED);
            return;
        }

        var filename = SYSTEM.SETTINGS.TempPath + path.sep + installationCode + '.zip';

        if (fs.existsSync(filename))
            fs.removeSync(filename);

        if (self.appBundleDataStream) {
            self.appBundleDataStream.end();
            self.appBundleDataStream.removeAllListeners('finish');
            self.appBundleDataStream.removeAllListeners('error');
            self.appBundleDataStream = undefined;
        }

        socket.emit(self.APISpec.CancelInstall.RES, installationCode);
    });

    socket.on(self.APISpec.Uninstall.REQ, function(appInfo) {
        if (!self.securityManager.canManageApps(socket)) {
            socket.emit(self.APISpec.Uninstall.ERR, SYSTEM.ERROR.ERROR_SECURITY_ACCESS_DENIED);
            return;
        }

        var result = self.uninstall(appInfo).result;
        if (result === 'OK')
            socket.emit(self.APISpec.Uninstall.RES, appInfo);
        else
            socket.emit(self.APISpec.Uninstall.ERR, result);
    });

    /* Create user app path if not exist */
    if (!fs.existsSync(USER_APP_PATH))
        fs.mkdirsSync(USER_APP_PATH);

    complete && complete();
}

AppManager.prototype.unregister = function(socket) {
    socket.removeAllListeners(this.APISpec.List.REQ);
    socket.removeAllListeners(this.APISpec.Install.REQ);
    socket.removeAllListeners(this.APISpec.CancelInstall.REQ);
    socket.removeAllListeners(this.APISpec.Uninstall.REQ);
}

AppManager.prototype.getAppInfo = function(appDirectory) {
    var file = BUILTIN_APP_PATH + path.sep + appDirectory + path.sep + APP_INFO_FILE;

    if (fs.existsSync(file)) {
        var appInfo = fs.readJsonSync(file);

        if (appInfo)
            return appInfo;
        else
            return SYSTEM.ERROR.ERROR_FS_IO;
    }
    else
        return SYSTEM.ERROR.ERROR_FS_NOT_EXIST;
}

AppManager.prototype.listApps = function() {
    this.apps = [];

    try {
        var builtinApps = this.loadApps(BUILTIN_APP_PATH, fs.readdirSync(BUILTIN_APP_PATH).filter(function (file) {
            var stat = fs.lstatSync(BUILTIN_APP_PATH + path.sep + file);
            if (stat.isDirectory())
                if (fs.existsSync(BUILTIN_APP_PATH + path.sep + file + path.sep + APP_INFO_FILE))
                    return true;
            return false;
        }));

        var userApps = this.loadApps(USER_APP_PATH, fs.readdirSync(USER_APP_PATH).filter(function (file) {
            var stat = fs.lstatSync(USER_APP_PATH + path.sep + file);
            if (stat.isDirectory())
                if (fs.existsSync(USER_APP_PATH + path.sep + file + path.sep + APP_INFO_FILE))
                    return true;
            return false;
        }));

        return { builtin: builtinApps, user: userApps };
    }
    catch (err) {
        console.log("listApps: " + err);
        return { builtin: [], user: [] };
    }
}

AppManager.prototype.install = function(appBundlePath) {
    var appBundle;
    var appInfo;
    var oldAppInfo;
    var officialUpgrade = false;

    if (!fs.existsSync(appBundlePath))
        return { result: SYSTEM.ERROR.ERROR_FS_NOT_EXIST };

    try {
        appBundle = new AdmZip(appBundlePath);
    }
    catch (err) {
        return { result: SYSTEM.ERROR.ERROR_APP_BAD_FILE_FORMAT };
    }

    appInfo = this.verifyAppBundle(appBundle);
    if (!appInfo)
        return { result: SYSTEM.ERROR.ERROR_APP_BAD_STRUCT };

    /* Extract APP bundle */
    try {
        appBundle.extractAllTo(SYSTEM.SETTINGS.TempPath, true);
    }
    catch (err) {
        return { result: SYSTEM.ERROR.ERROR_APP_EXTRACT };
    }

    if (appInfo.AppIdentifier === undefined)
        appInfo.AppIdentifier = 'UAPP00000000';

    if (appInfo.AppIdentifier.indexOf('BAPP') === 0) {
        var builtinAppPath = BUILTIN_APP_PATH + path.sep + appInfo.Directory;

        if (fs.existsSync(builtinAppPath)) {
            upgradeApp(builtinAppPath, appInfo, true);
        }
        else {
            installApp(builtinAppPath, appInfo);
        }
    }
    else if (appInfo.AppIdentifier.indexOf('UAPP') === 0) {
        var userAppPath = USER_APP_PATH + path.sep + appInfo.Directory;

        if (fs.existsSync(userAppPath)) {
            upgradeApp(userAppPath, appInfo, false);
        }
        else {
            installApp(userAppPath, appInfo);

            /* Generate user APP indentifier */
            if (appInfo.AppIdentifier === 'UAPP00000000') {
                while (1) {
                    appInfo.AppIdentifier = randomstring.generate('UAPPXXXXXXXX');
                    if (this.apps[appInfo.AppIdentifier])
                        continue;

                    fs.writeJsonSync(userAppPath + path.sep + APP_INFO_FILE, appInfo);
                    break;
                }
            }
        }
    }
    else {
        return { result: SYSTEM.ERROR.ERROR_APP_BAD_ID };
    }

    function installApp(appPath, appInfo) {
        try {
            /* Install extracted APP */
            fse.moveSync(SYSTEM.SETTINGS.TempPath + path.sep + appInfo.Directory, appPath);
        }
        catch (error) {
            console.log("installApp: " + error);
            return { result: SYSTEM.ERROR.APPInstall };
        }
    }

    function upgradeApp(appPath, appInfo, backupOrig) {
        var jsonAppInfo = fs.readFileSync(appPath + path.sep + APP_INFO_FILE);
        oldAppInfo = JSON.parse(jsonAppInfo);

        if (appInfo.Directory != oldAppInfo.Directory)
            return { result: SYSTEM.ERROR.ERROR_APP_UPGRADE };

        if (appInfo.AppIdentifier === oldAppInfo.AppIdentifier)
            officialUpgrade = true;

        if (backupOrig) {
            /* First make a backup of first builtin version */
            if (!fs.existsSync(appPath + '.backup'))
                fse.moveSync(appPath, appPath + '.backup');
        }

        try {
            /* Install extracted APP */
            fs.copySync(SYSTEM.SETTINGS.TempPath + path.sep + appInfo.Directory, appPath);
        }
        catch (error) {
            console.log("upgradeApp: " + error);
            return { result: SYSTEM.ERROR.APPInstall };
        }

        /* Copy APP identifier if this is not an official upgrade */
        if (!officialUpgrade) {
            appInfo.AppIdentifier = oldAppInfo.AppIdentifier;
            fs.writeJsonSync(appPath + path.sep + APP_INFO_FILE, appInfo);
        }

        /* Remove tmp path */
        fs.removeSync(SYSTEM.SETTINGS.TempPath + path.sep + appInfo.Directory);
    }

    return { result: 'OK' };
}

AppManager.prototype.uninstall = function(appInfo) {
    var appPath = USER_APP_PATH + path.sep + appInfo.Directory;

    if (!fs.existsSync(appPath))
        return { result: SYSTEM.ERROR.ERROR_FS_NOT_EXIST };

    try {
        /* Remove from app list */
        this.apps[appInfo.AppIdentifier] = undefined;

        /* Remove APP in user storage */
        fs.removeSync(appPath);
    }
    catch (err) {
        console.log(err);
        return { result: SYSTEM.ERROR.ERROR_FS_REMOVE };
    }

    return { result: 'OK' };
}
