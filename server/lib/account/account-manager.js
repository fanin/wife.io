'use strict';

var fs = require('fs-extra');
var path = require('path');
var config = require('config');

class AccountManager {
  constructor() {
    [ 'Shared', 'Guest' ].forEach((n) => {
      let p = path.resolve(path.join(
        config.settings.user_data_path,
        config.settings.sys_name,
        'Users',
        n
      ));

      fs.mkdirp(p);
    });
  }

  createDirectories(user) {
    let p = path.resolve(path.join(
      config.settings.user_data_path,
      config.settings.sys_name,
      'Users',
      user
    ));

    fs.mkdirp(p);

    [
      'Applications',
      'Documents',
      'Pictures',
      'Movies',
      'Music',
      'Public'
    ].forEach((n) => {
      fs.mkdirp(path.join(p, n));
    });
  }

  getDirectory(user, type) {
    switch (type) {
    case 'Applications':
    case 'Documents':
    case 'Pictures':
    case 'Movies':
    case 'Music':
    case 'Public':
      return path.resolve(path.join(
        config.settings.user_data_path,
        config.settings.sys_name,
        'Users',
        user || 'Guest',
        type
      ));
    default:
      return null;
    }
  }
}

module.exports = new AccountManager();
