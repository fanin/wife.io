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

    /* Maintain a 'identifier:manifest' dictionary array for all Apps */
    this.apps = [];

    /* Private methods */
    this.verifyAppManifest = function(manifest) {
        if (manifest.name === undefined)
            return false;
        if (manifest.version === undefined)
            return false;
        if (manifest.ws_api_version === undefined)
            return false;
        if (manifest.directory === undefined)
            return false;
        if (manifest.entry === undefined)
            return false;
        if (manifest.show_in_launcher === undefined)
            return false;
        return true;
    };

    this.verifyAppBundle = function(appBundle) {
        var manifest = null;
        var appDirs = [];

        try {
            appBundle.getEntries().every(function(zipEntry, index, zipEntries) {
                if (zipEntry.isDirectory)
                    appDirs.push(path.join(zipEntry.entryName, '.'));
                else if (path.basename(zipEntry.entryName) === APP_INFO_FILE) {
                    try {
                        var info = JSON.parse(appBundle.readAsText(zipEntry, 'utf8'));
                        if (this.verifyAppManifest(info)) {
                            if (appBundle.getEntry(info.directory + path.sep + info.entry)) {
                                if (appDirs.indexOf(info.directory) >= 0) {
                                    manifest = info;
                                    return false;
                                }
                            }
                        }
                    }
                    catch (err) { console.log('Parse app manifest error: ' + err); }
                    return false;
                }

                return true;
            }.bind(this));
        }
        catch (err) { 'App bundle error: ' + console.log(err); }

        return manifest;
    };

    this.loadApps = function(_path, list) {
        var appList = [];

        for (var i in list) {
            var jsonManifest = fs.readFileSync(_path + path.sep + list[i] + path.sep + APP_INFO_FILE);
            if (jsonManifest) {
                try {
                    var manifest = JSON.parse(jsonManifest);
                    if (this.verifyAppManifest(manifest)) {
                        if (_path === USER_APP_PATH) {
                            if (manifest.identifier) {
                                this.apps[manifest.identifier] = manifest;

                                /* Erase identifier digits */
                                manifest.identifier = 'UAPP00000000';
                                appList.push(manifest);
                            }
                            else
                                console.log('Invalid App: No identifier');
                        }
                        else {
                            /* FIXME: Builtin App Indentifier should be generated at build time */
                            if (manifest.identifier === undefined) {
                                /* Generate builtin APPs indentifier for first time running */
                                manifest.identifier = randomstring.generate('BAPPXXXXXXXX');
                                fs.writeJsonSync(_path + path.sep + list[i] + path.sep + APP_INFO_FILE, manifest);
                            }

                            this.apps[manifest.identifier] = manifest;

                            /* Erase identifier digits for security reason, we only return APP type 'BAPP/UAPP' to client */
                            manifest.identifier = 'BAPP00000000';
                            appList.push(manifest);
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

    socket.on(self.APISpec.Uninstall.REQ, function(manifest) {
        if (!self.securityManager.canManageApps(socket)) {
            socket.emit(self.APISpec.Uninstall.ERR, SYSTEM.ERROR.ERROR_SECURITY_ACCESS_DENIED);
            return;
        }

        var result = self.uninstall(manifest).result;
        if (result === 'OK')
            socket.emit(self.APISpec.Uninstall.RES, manifest);
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

AppManager.prototype.getAppManifest = function(appDirectory) {
    var file = BUILTIN_APP_PATH + path.sep + appDirectory + path.sep + APP_INFO_FILE;

    if (fs.existsSync(file)) {
        var manifest = fs.readJsonSync(file);

        if (manifest)
            return manifest;
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
    var manifest;
    var oldManifest;
    var officialUpgrade = false;

    if (!fs.existsSync(appBundlePath))
        return { result: SYSTEM.ERROR.ERROR_FS_NOT_EXIST };

    try {
        appBundle = new AdmZip(appBundlePath);
    }
    catch (err) {
        return { result: SYSTEM.ERROR.ERROR_APP_BAD_FILE_FORMAT };
    }

    manifest = this.verifyAppBundle(appBundle);
    if (!manifest)
        return { result: SYSTEM.ERROR.ERROR_APP_BAD_STRUCT };

    /* Extract APP bundle */
    try {
        appBundle.extractAllTo(SYSTEM.SETTINGS.TempPath, true);
    }
    catch (err) {
        return { result: SYSTEM.ERROR.ERROR_APP_EXTRACT };
    }

    if (manifest.identifier === undefined)
        manifest.identifier = 'UAPP00000000';

    if (manifest.identifier.indexOf('BAPP') === 0) {
        var builtinAppPath = BUILTIN_APP_PATH + path.sep + manifest.directory;

        if (fs.existsSync(builtinAppPath)) {
            upgradeApp(builtinAppPath, manifest, true);
        }
        else {
            installApp(builtinAppPath, manifest);
        }
    }
    else if (manifest.identifier.indexOf('UAPP') === 0) {
        var userAppPath = USER_APP_PATH + path.sep + manifest.directory;

        if (fs.existsSync(userAppPath)) {
            upgradeApp(userAppPath, manifest, false);
        }
        else {
            installApp(userAppPath, manifest);

            /* Generate user APP indentifier */
            if (manifest.identifier === 'UAPP00000000') {
                while (1) {
                    manifest.identifier = randomstring.generate('UAPPXXXXXXXX');
                    if (this.apps[manifest.identifier])
                        continue;

                    fs.writeJsonSync(userAppPath + path.sep + APP_INFO_FILE, manifest);
                    break;
                }
            }
        }
    }
    else {
        return { result: SYSTEM.ERROR.ERROR_APP_BAD_ID };
    }

    function installApp(appPath, manifest) {
        try {
            /* Install extracted APP */
            fse.moveSync(SYSTEM.SETTINGS.TempPath + path.sep + manifest.directory, appPath);
        }
        catch (error) {
            console.log("installApp: " + error);
            return { result: SYSTEM.ERROR.APPInstall };
        }
    }

    function upgradeApp(appPath, manifest, backupOrig) {
        var jsonManifest = fs.readFileSync(appPath + path.sep + APP_INFO_FILE);
        oldManifest = JSON.parse(jsonManifest);

        if (manifest.directory != oldManifest.directory)
            return { result: SYSTEM.ERROR.ERROR_APP_UPGRADE };

        if (manifest.identifier === oldManifest.identifier)
            officialUpgrade = true;

        if (backupOrig) {
            /* First make a backup of first builtin version */
            if (!fs.existsSync(appPath + '.backup'))
                fse.moveSync(appPath, appPath + '.backup');
        }

        try {
            /* Install extracted APP */
            fs.copySync(SYSTEM.SETTINGS.TempPath + path.sep + manifest.directory, appPath);
        }
        catch (error) {
            console.log("upgradeApp: " + error);
            return { result: SYSTEM.ERROR.APPInstall };
        }

        /* Copy APP identifier if this is not an official upgrade */
        if (!officialUpgrade) {
            manifest.identifier = oldManifest.identifier;
            fs.writeJsonSync(appPath + path.sep + APP_INFO_FILE, manifest);
        }

        /* Remove tmp path */
        fs.removeSync(SYSTEM.SETTINGS.TempPath + path.sep + manifest.directory);
    }

    return { result: 'OK' };
}

AppManager.prototype.uninstall = function(manifest) {
    var appPath = USER_APP_PATH + path.sep + manifest.directory;

    if (!fs.existsSync(appPath))
        return { result: SYSTEM.ERROR.ERROR_FS_NOT_EXIST };

    try {
        /* Remove from app list */
        this.apps[manifest.identifier] = undefined;

        /* Remove APP in user storage */
        fs.removeSync(appPath);
    }
    catch (err) {
        console.log(err);
        return { result: SYSTEM.ERROR.ERROR_FS_REMOVE };
    }

    return { result: 'OK' };
}
