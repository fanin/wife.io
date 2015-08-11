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
 *   System Disk:      Read only
 *   System Data Disk: User app & app user data
 *   Removable Disk:   USB disks, SD Cards
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
    this.dataDisk = null;
    this.removableDisk = [];
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
    var dataDisk = null;
    var removableDisk = [];

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
                }
                else if (path.resolve(config.settings.user_data_path)
                             .indexOf(path.resolve(data[i].mountpoint)) === 0) {
                    dataDisk = data[i];
                }
                else if (data[i].mountpoint.indexOf('/mnt') === 0 ||
                         data[i].mountpoint.indexOf('/media') === 0 ||
                         data[i].mountpoint.indexOf('/Volumes') === 0 ||
                         data[i].mountpoint.match(/^[A-Z]:/)) {
                    removableDisk.push(data[i]);
                }
            }

            /* Save disk status */
            if (this.systemDisk === null) {
                /* This is the first time getting disks info */
                this.systemDisk = systemDisk;
                if (this.systemDisk) {
                    this.systemDisk.type = "System";
                    if (!this.systemDisk.uuid)
                        this.systemDisk.uuid = uuid.v4();
                }

                this.dataDisk = dataDisk;
                if (this.dataDisk) {
                    this.dataDisk.type = "Data";
                    if (!this.dataDisk.uuid)
                        this.dataDisk.uuid = uuid.v4();
                }
                else
                    throw new Error('Unable to find internal data disk (' + config.settings.user_data_path + ').');

                this.removableDisk = removableDisk;
                for (i = 0; i < this.removableDisk.length; i++) {
                    this.removableDisk[i].type = "Removable";
                    if (!this.removableDisk[i].uuid)
                        this.removableDisk[i].uuid = uuid.v4();
                }
            }
            else {
                /* Backup previous removable disks array to examine disk insertion/removal */
                var _oldDisk = this.removableDisk;
                this.removableDisk = removableDisk;

                /* Set disk type */
                for (var i = 0; i < this.removableDisk.length; i++) {
                    this.removableDisk[i].type = "Removable";
                }

                /* Reset present flag */
                for (var j = 0; j < _oldDisk.length; j++) {
                    _oldDisk[j].present = false;
                }

                /* Examine if removable disk array changes */
                for (i = 0; i < this.removableDisk.length; i++) {
                    for (j = 0; j < _oldDisk.length; j++) {
                        /* To compare two disks by their mountpoint and total capacity */
                        if (this.removableDisk[i].mountpoint === _oldDisk[j].mountpoint &&
                            this.removableDisk[i].total === _oldDisk[j].total) {
                            this.removableDisk[i].uuid = this.removableDisk[i].uuid || _oldDisk[j].uuid;
                            this.removableDisk[i].present = true;
                            _oldDisk[j].present = true;
                        }
                    }
                }

                for (i = 0; i < this.removableDisk.length; i++) {
                    if (!this.removableDisk[i].present) {
                        this.removableDisk[i].type = "Removable";
                        /* Create a fake uuid if there's no uuid found for the disk */
                        // TODO: os should get uuid for all disks
                        if (!this.removableDisk[i].uuid)
                            this.removableDisk[i].uuid = uuid.v4();

                        ssemgr.broadcast("storage", { eventType: "INSERT", disk: this.removableDisk[i] });
                    }
                }

                for (i = 0; i < _oldDisk.length; i++)
                    if (!_oldDisk[i].present)
                        ssemgr.broadcast("storage", { eventType: "REMOVE", disk: _oldDisk[i] });
            }

            callback && callback([ this.dataDisk ].concat(this.removableDisk));

            this.pausePolling = false;
        }.bind(this));
    }.bind(this));
}

StorageManager.prototype.getSystemDisk = function() {
    return this.systemDisk;
}

StorageManager.prototype.getDataDisk = function() {
    return this.dataDisk;
}

StorageManager.prototype.getDiskByUUID = function(uuid) {
    if (!uuid)
        return null;

    if (this.systemDisk && this.systemDisk.uuid === uuid)
        return this.systemDisk;

    if (this.dataDisk && this.dataDisk.uuid === uuid)
        return this.dataDisk;

    for (var i = 0; i < this.removableDisk.length; i++)
        if (this.removableDisk[i].uuid === uuid)
            return this.removableDisk[i];

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
