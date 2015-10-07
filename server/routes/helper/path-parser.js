var path = require('path');
var config = require('config');
var appmgr = require('lib/app/app-manager');
var stormgr = require('lib/storage/storage-manager');

function handleSysDataReq(params, resolve, reject) {
  if (params.method !== 'GET') {
    return reject({
      code: 403,
      message: 'Read only file system'
    });
  }

  var app = appmgr.getManifest(params.appid);
  if (app) {
    resolve(
      path.resolve(path.join(
        config.settings.root_path,
        'apps',
        app.directory,
        'data',
        params.path.slice(params.disksym.length)
      ))
    );
  }
  else
    reject({ code: 404, message: 'App not found' });
}

function handleUserDataReq(params, resolve, reject) {
  var user = 'Guest';
  var target = params.disksym
                ? params.path.slice(params.disksym.length)
                : params.path;

  if (params.user)
    user = params.user.email;

  resolve(
    path.resolve(path.join(
      config.settings.user_data_path,
      config.settings.sys_name,
      'Users',
      user,
      target
    ))
  );
}

function handleSharedUserDataReq(params, resolve, reject) {
  resolve(
    path.resolve(path.join(
      config.settings.user_data_path,
      config.settings.sys_name,
      'Users/Shared',
      params.path.slice(disksym.length)
    ))
  );
}


function parse(params) {
  return new Promise(function(resolve, reject) {
    console.log('Parse ' + params.path);

    if (params.path.indexOf('@') === 0) {
      var appid = params.appid;
      params.disksym = params.path.split('/')[0];

      if (params.disksym === '@SYSURL') {
        handleSysDataReq(params, resolve, reject);
      }
      else if (params.disksym === '@USERURL') {
        handleUserDataReq(params, resolve, reject);
      }
      else if (params.disksym === '@SHURL') {
        handleSharedUserDataReq(params, resolve, reject);
      }
      else if (params.disksym.indexOf('@DISKURL') === 0) {
        var diskuuid = params.disksym.slice(8);
        var disk = stormgr.getDiskByUUID(diskuuid);

        if (disk) {
          if (disk.uuid === stormgr.getSystemDisk().uuid) {
            reject({
              code: 403,
              message: 'Direct access to system disk is forbidden'
            });
          }
          else if (disk.uuid === stormgr.getUserDataDisk().uuid) {
            reject({
              code: 403,
              message: 'Direct access to internal data disk is forbidden'
            });
          }
          else {
            resolve(
              path.resolve(path.join(
                disk.mountpoint,
                params.path.slice(params.disksym.length)
              ))
            );
          }
        }
        else {
          reject({ code: 404, message: 'Disk not found' });
        }
      }
      else {
        reject({ code: 400, message: 'Bad path URL format' });
      }
    }
    else {
      handleUserDataReq(params, resolve, reject);
    }
  });
}

module.exports = function(req, res, next) {
  if (req.params.path) {
    parse({
      path: req.params.path,
      method: req.method,
      user: req.user,
      appid: req.cookies.appid
    })
    .then(function(path) {
      console.log('Parse result: ' + path);
      req.params.path = path;
      next();
    })
    .catch(function(err) {
      console.log('Parse path error: ' + err);
      res.status(err.code).send(err.message);
    });
  }
  else if (req.params.target) {
    Promise.all([
      parse({
        path: req.params.source,
        method: 'GET',
        user: req.user,
        appid: req.cookies.appid
      }),
      parse({
        path: req.params.target,
        method: req.method,
        user: req.user,
        appid: req.cookies.appid
      })
    ])
    .then(function(results) {
      req.params.source = results[0];
      req.params.target = results[1];
      next();
    })
    .catch(function(err) {
      res.status(err.code).send(err.message)
    });
  }
  else {
    res.sendStatus(400);
  }
}
