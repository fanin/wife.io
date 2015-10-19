/*
Generate appid:
  manifest.identifier = randomstring('UAXXXXXXXX');
Read manifest:
  var manifest = fs.readJsonSync(file);
*/

"use strict";

var fs     = require('fs-extra'),
    path   = require('path'),
    AdmZip = require('adm-zip'),
    config = require('config');

//fs.jsonfile.spaces = 4;

const USER_APP_PATH = path.resolve(path.join(
                      config.settings.user_data_path,
                      config.settings.sys_name,
                      'Applications'
                    ));
const INTERNAL_APP_PATH = path.join(config.settings.root_path, 'apps');
const MANIFEST_FILE = 'manifest.json';

function AppManager() {
  this.appList = [];
  /* Maintain a 'identifier:manifest' dictionary array for all apps */
  this.appDict = [];

  fs.mkdirp(USER_APP_PATH);

  this._verifyBundle = function(appBundle) {
    var manifest = null;
    var appDirs = [];

    try {
      appBundle.getEntries().every(function(zipEntry, index, zipEntries) {
        if (zipEntry.isDirectory)
          appDirs.push(path.join(zipEntry.entryName, '.'));
        else if (path.basename(zipEntry.entryName) === MANIFEST_FILE) {
          try {
            var info = JSON.parse(appBundle.readAsText(zipEntry, 'utf8'));
            if (this._verifyManifest(info)) {
              if (appBundle.getEntry(path.join(info.directory, info.entry))) {
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
  }

  this._verifyManifest = function(manifest) {
    if (manifest.name === undefined)
      return false;
    if (manifest.version === undefined)
      return false;
    if (manifest.directory === undefined)
      return false;
    if (manifest.entry === undefined)
      return false;
    if (manifest.identifier === undefined)
      return false;
    if (this.getType(manifest) === 'unknown')
      return false;
    return true;
  };

  this._buildAppDict = function(_path, list) {
    for (var i in list) {
      var jsonManifest = fs.readFileSync(path.join(_path, list[i], MANIFEST_FILE));
      if (jsonManifest) {
        try {
          var manifest = JSON.parse(jsonManifest);
          if (this._verifyManifest(manifest)) {
            if (!this.appDict[manifest.identifier]) {
              this.appList.push(manifest);
              this.appDict[manifest.identifier] = manifest;
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
  };

  this._install = function(appBundle, manifest) {
    try {
      appBundle.extractAllTo(USER_APP_PATH, true);
    }
    catch (err) {
      console.log('install: ' + err);
      return { status: 415, message: 'Extract App Package Failed' };
    }

    this.appList.push(manifest);
    this.appDict[manifest.identifier] = manifest;

    return { status: 200, message: 'Install OK', manifest: manifest };
  }

  this._upgrade = function(appBundle, manifest) {
    try {
      if (fs.existsSync(path.join(USER_APP_PATH, manifest.directory)))
        this._remove(manifest, true);
      appBundle.extractAllTo(USER_APP_PATH, true);
    }
    catch (err) {
      console.log('upgrade: ' + err);
      return { status: 415, message: 'Extract App Package Failed' };
    }

    return { status: 200, message: 'Upgrade OK', manifest: manifest };
  }

  this._remove = function(manifest, keepUserData) {
    var appPath = path.join(USER_APP_PATH, manifest.directory);

    if (keepUserData) {
      fs.readdirSync(appPath).filter(function(entry) {
        var file = path.join(appPath, entry);
        if (fs.lstatSync(file).isDirectory() && entry === 'userdata')
          return false;
        fs.removeSync(file);
        return true;
      });
    }
    else {
      fs.removeSync(appPath);
    }
  };

  /* Initially get app list */
  console.log('AppManager: getting app list...');

  try {
    this._buildAppDict(USER_APP_PATH, fs.readdirSync(USER_APP_PATH).filter(function(appDir) {
      if (fs.lstatSync(path.join(USER_APP_PATH, appDir)).isDirectory())
        if (fs.existsSync(path.join(USER_APP_PATH, appDir, MANIFEST_FILE)))
          return true;
      return false;
    }));

    this._buildAppDict(INTERNAL_APP_PATH, fs.readdirSync(INTERNAL_APP_PATH).filter(function(appDir) {
      if (fs.lstatSync(path.join(INTERNAL_APP_PATH, appDir)).isDirectory())
        if (fs.existsSync(path.join(INTERNAL_APP_PATH, appDir, MANIFEST_FILE)))
          return true;
      return false;
    }));
  }
  catch (err) {
    console.log("list: " + err);
  }
}

AppManager.prototype.getType = function(manifest) {
  if (manifest.identifier.indexOf('IA') === 0)
    return 'internal';
  else if (manifest.identifier.indexOf('CA') === 0)
    return 'certified';
  else if (manifest.identifier.indexOf('UA') === 0)
    return 'user';
  else
    return 'unknown';
}

AppManager.prototype.list = function() {
  return this.appList;
}

AppManager.prototype.getManifest = function(appid) {
  return this.appDict[appid];
}

AppManager.prototype.getBuiltinDataPath = function(appid, url) {
  var manifest = appid ? this.appDict[appid] : null;

  if (!manifest)
    return null;

  if (manifest.identifier.indexOf('IA') === 0 || manifest.identifier.indexOf('CA') === 0)
    return path.join(config.settings.root_path, '/apps', manifest.directory, 'data', url );
  else
    return path.join(
      config.settings.user_data_path,
      config.settings.sys_name.replace(/\s/g, '').toLocaleLowerCase(),
      'apps',
      manifest.directory,
      'data'
    );
}

AppManager.prototype.install = function(appBundlePath) {
  var appBundle;

  if (!fs.existsSync(appBundlePath))
    return { status: 404, message: 'App Package Path Not Exist' };

  try {
    appBundle = new AdmZip(appBundlePath);
  }
  catch (err) {
    return { status: 500, message: 'Load App Package Failed' };
  }

  var manifest = this._verifyBundle(appBundle);
  if (!manifest)
    return { status: 415, message: 'Bad App Package Content' };

  switch (this.getType(manifest)) {
  case 'internal':
    if (this.appDict[manifest.identifier])
      return this._upgrade(appBundle, manifest);
    else
      return { status: 404, message: 'Internal App Not Found For Upgrade' };
  case 'certified':
    return { status: 501, message: 'Certified App Not Supported' };
  case 'user':
    if (this.appDict[manifest.identifier])
      return this._upgrade(appBundle, manifest);
    else
      return this._install(appBundle, manifest);
  }
}

AppManager.prototype.uninstall = function(manifest, keepUserData) {
  var appDirExist = fs.existsSync(path.join(USER_APP_PATH, manifest.directory)),
    appManifestExist = fs.existsSync(path.join(USER_APP_PATH, manifest.directory, MANIFEST_FILE));

  if ((this.getType(manifest) === 'internal') && this.appDict[manifest.identifier] && !appDirExist)
    return { status: 403, message: 'Uninstall Internal App Forbidden' };
  if (!appDirExist)
    return { status: 500, message: 'App Path Not Found' };

  if (this.getType(manifest) !== 'internal') {
    this.appList.splice(this.appList.indexOf(this.appDict[manifest.identifier]), 1);
    this.appDict[manifest.identifier] = undefined;
  }

  this._remove(manifest, keepUserData);

  return { status: 200, message: 'Uninstall OK' };
}

var singleton = function() {
  if (singleton.caller != singleton.getInstance) {
    throw new Error("This object cannot be instanciated");
  }
}

singleton.instance = null;

singleton.getInstance = function() {
  if(this.instance === null) {
    this.instance = new AppManager();
  }
  return this.instance;
}

module.exports = singleton.getInstance();
