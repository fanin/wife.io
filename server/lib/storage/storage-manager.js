"use strict";

/**
 * Storage Object:
 *
 * {
 *   used: '163.94 GB',
 *   available: '68.43 GB',
 *   mountpoint: '/',
 *   uuid: '14131988-9579-3A7E-BE21-991936E49CAA',
 *   name: 'MacintoshHD',
 *   freePer: '29',
 *   usedPer: '71',
 *   total: '232.37 GB',
 *   drive: '/dev/disk1',
 *   type: 'System'
 * }
 *
 * Storage Type:
 *   Internal Storage: Disk where OS installed
 *   Removable Disk:   Internal partitions/disks, USB disks, SD Cards
 */

// TODO: Emit disk full event

var fs     = require('fs-extra'),
    path   = require('path'),
    uuid   = require('node-uuid'),
    config = require('config'),
    disks  = require('./disks'),
    ssemgr = require('../sse/sse-manager');

function StorageManager() {
  this.systemDisk = null;
  this.dataDisk = [];
  this.pausePolling = false;

  this.getDisks(function(disks, error) {
    this.pausePolling = false;
  }.bind(this));

  /*
   * Start disk monitor
   * FIXME: Integrate with system disk event instead of polling
   */
  setInterval(function() {
    if (!this.pausePolling) {
      this.getDisks(function(disks, error) {
        this.pausePolling = false;
      }.bind(this));
    }
  }.bind(this), 3000);
}

StorageManager.prototype.verifyDiskInfo = function(disk) {
  if (!disk) return false;
  if (!disk.type) return false;
  if (!disk.mountpoint) return false;
  if (!disk.uuid) return false;
  if (disk.total === undefined) return false;
  if (disk.available === undefined) return false;
  if (disk.used === undefined) return false;
  return true;
}

StorageManager.prototype.getDisks = function(callback) {
  var systemDisk = null;
  var userDataDisk = null;
  var dataDisk = [];

  this.pausePolling = true;

  disks.drives(function (err, drives) {
    if (err) {
      callback && callback(null, err);
      return;
    }

    disks.drivesDetail(drives, function (err, data) {
      if (err) {
        callback && callback(null, err);
        return;
      }

      for (var i = 0; i < data.length; i++) {
        if (data[i].mountpoint === '/' || data[i].mountpoint === 'C:') {
          systemDisk = data[i];
          systemDisk.type = 'Internal Storage';
        }
        else if (data[i].mountpoint.indexOf('/mnt') === 0 ||
             data[i].mountpoint.indexOf('/media') === 0 ||
             data[i].mountpoint.indexOf('/Volumes') === 0 ||
             data[i].mountpoint.match(/^[A-Z]:/)) {
          data[i].type = 'Removable Disk';
          dataDisk.push(data[i]);
        }

        if (
            !this.userDataDisk &&
            path.resolve(config.settings.user_data_path)
                .indexOf(path.resolve(data[i].mountpoint)) === 0
        ) {
          data[i].type = 'Internal Storage';
          this.userDataDisk = data[i];
          console.log('Found user data disk, mountpoint = ', data[i].mountpoint);
        }
      }

      /* Save disk status */
      if (this.systemDisk === null) {
        /* This is the first time getting disks info */
        this.systemDisk = systemDisk;
        if (this.systemDisk && !this.systemDisk.uuid) {
          this.systemDisk.uuid = uuid.v4();
        }

        this.dataDisk = dataDisk;
        for (i = 0; i < this.dataDisk.length; i++) {
          if (!this.dataDisk[i].uuid)
            this.dataDisk[i].uuid = uuid.v4();
        }
      }
      else {
        /* Backup previous data disks array to examine disk insertion/removal */
        var _oldDisk = this.dataDisk;
        this.dataDisk = dataDisk;

        /* Set disk type */
        for (var i = 0; i < this.dataDisk.length; i++) {
          this.dataDisk[i].type = 'Removable Disk';
        }

        /* Reset present flag */
        for (var j = 0; j < _oldDisk.length; j++) {
          _oldDisk[j].present = false;
        }

        /* Examine if data disk array changes */
        for (i = 0; i < this.dataDisk.length; i++) {
          for (j = 0; j < _oldDisk.length; j++) {
            /* To compare two disks by their mountpoint and total capacity */
            if (this.dataDisk[i].mountpoint === _oldDisk[j].mountpoint &&
              this.dataDisk[i].total === _oldDisk[j].total) {
              this.dataDisk[i].uuid = this.dataDisk[i].uuid || _oldDisk[j].uuid;
              this.dataDisk[i].present = true;
              _oldDisk[j].present = true;
            }
          }
        }

        for (i = 0; i < this.dataDisk.length; i++) {
          if (!this.dataDisk[i].present) {
            this.dataDisk[i].type = 'Removable Disk';
            /* Create a fake uuid if there's no uuid found for the disk */
            // TODO: os should get uuid for all disks
            if (!this.dataDisk[i].uuid)
              this.dataDisk[i].uuid = uuid.v4();

            ssemgr.broadcast(
              "storage", { eventType: "INSERT", disk: this.dataDisk[i] }
            );
          }
        }

        for (i = 0; i < _oldDisk.length; i++)
          if (!_oldDisk[i].present)
            ssemgr.broadcast("storage", { eventType: "REMOVE", disk: _oldDisk[i] });
      }

      callback && callback([ this.systemDisk ].concat(this.dataDisk));

      this.pausePolling = false;
    }.bind(this));
  }.bind(this));
}

StorageManager.prototype.getSystemDisk = function() {
  return this.systemDisk;
}

StorageManager.prototype.getUserDataDisk = function() {
  return this.userDataDisk;
}

StorageManager.prototype.getDiskByUUID = function(uuid) {
  if (!uuid)
    return null;

  if (this.systemDisk && this.systemDisk.uuid === uuid)
    return this.systemDisk;

  for (var i = 0; i < this.dataDisk.length; i++)
    if (this.dataDisk[i].uuid === uuid)
      return this.dataDisk[i];

  return null;
}

var singleton = function() {
  if (singleton.caller != singleton.getInstance) {
    throw new Error("This object cannot be instanciated");
  }
}

singleton.instance = null;

singleton.getInstance = function() {
  if(this.instance === null) {
    this.instance = new StorageManager();
  }
  return this.instance;
}

module.exports = singleton.getInstance();
