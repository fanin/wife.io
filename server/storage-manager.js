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
 * Storage Notification:
 *   Category: system.storage
 *   Notifications:
 *      disk.inuse.change
 *      disk.removable.insert
 *      disk.removable.remove
 *      disk.error
 */

var fs      = require('fs-extra');
var path    = require('path');
var storage = require('./lib/disks.js');
var uuid    = require('node-uuid');
var SYSTEM  = require('./system');

module.exports = StorageManager;

function StorageManager(_super, wsapi) {
    this._super = _super;
    this.wsapi = wsapi;
    this.notificationCenter = _super.notificationCenter;
    this.securityManager = _super.securityManager;
    this.systemDisk = null;
    this.systemDataDisk = null;
    this.disksInUse = [];
    this.removableDisk = [];
    this.pausePolling = false;

    /*
     * Start disk monitor
     * FIXME: Integrate with system disk event instead of polling
     */
    this.diskMonitorTimer = setInterval(function() {
        if (!this.pausePolling) {
            this.getLocalDisks(function(disks, error) {
                this.pausePolling = false;
            }.bind(this));
        }
    }.bind(this), 3000);
}

StorageManager.prototype.register = function(socket, complete) {
    /**
     * Protocol Listener: Storage Events
     */
    socket.on(this.wsapi.GetLocalDisks.REQ, function() {
        this.getLocalDisks(function(disks, error) {
            if (error) {
                socket.emit(this.wsapi.GetLocalDisks.ERR, SYSTEM.ERROR.ERROR_STOR_DISK_API);
            }
            else {
                if (!disks.system) {
                    socket.emit(this.wsapi.GetLocalDisks.ERR, SYSTEM.ERROR.ERROR_STOR_DISK_NOT_FOUND);
                }

                socket.emit(this.wsapi.GetLocalDisks.RES, disks);
            }

            this.pausePolling = false;
        }.bind(this));
    }.bind(this));

    socket.on(this.wsapi.SetDiskInUse.REQ, function(disk) {
        if (this.securityManager.isExternalUserDataAllowed(socket)) {
            if (this.verifyDiskInfo(disk)) {
                if (this.disksInUse[socket].mountpoint !== disk.mountpoint) {
                    this.disksInUse[socket] = disk;
                    this.notificationCenter.post("system.storage", "disk.inuse.change", disk);
                }
                socket.emit(this.wsapi.SetDiskInUse.RES, disk);
            }
            else {
                if (!this.disksInUse[socket])
                    this.disksInUse[socket] = this.getDefaultDiskInUse();
                socket.emit(this.wsapi.SetDiskInUse.ERR, SYSTEM.ERROR.ERROR_STOR_BAD_DISK_INFO);
            }
        }
        else {
            if (!this.disksInUse[socket])
                this.disksInUse[socket] = this.getDefaultDiskInUse();
            socket.emit(this.wsapi.SetDiskInUse.ERR, SYSTEM.ERROR.ERROR_SECURITY_EXTERNAL_NOT_ALLOWED);
        }
    }.bind(this));

    socket.on(this.wsapi.GetDiskInUse.REQ, function() {
        if (this.disksInUse[socket])
            socket.emit(this.wsapi.GetDiskInUse.RES, this.disksInUse[socket]);
        else
            socket.emit(this.wsapi.GetDiskInUse.ERR, SYSTEM.ERROR.ERROR_STOR_DISK_NOT_FOUND);
    }.bind(this));

    /* Get local disks initially */
    this.getLocalDisks(function(disks, error) {
        if (error) {
            this.notificationCenter.post("system.storage", "disk.error", error);
            this.pausePolling = true;
        }
        /* Examine sys_data_path */
        else if (!fs.existsSync(SYSTEM.SETTINGS.sys_data_path)) {
            error = SYSTEM.ERROR.ERROR_STOR_SYSDISK_NOT_FOUND;
            this.notificationCenter.post("system.storage", "disk.error", error);
            this.pausePolling = true;
        }
        else {
            try {
                /* Test sys_data_path write permission */
                fs.createFileSync(SYSTEM.SETTINGS.sys_data_path + "/test");
                fs.removeSync(SYSTEM.SETTINGS.sys_data_path + "/test");

                /* If user working disk for the client is not set, set to system disk by default */
                if (!this.disksInUse[socket])
                    this.disksInUse[socket] = this.getDefaultDiskInUse();
            }
            catch (e) {
                error = e.code;
                this.notificationCenter.post("system.storage", "disk.error", error);
            }
        }

        complete && complete(error);
    }.bind(this));
}

StorageManager.prototype.unregister = function(socket) {
    socket.removeAllListeners(this.wsapi.GetLocalDisks.REQ);
    if (this.disksInUse[socket])
        this.disksInUse[socket] = undefined;
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

StorageManager.prototype.getLocalDisks = function(callback) {
    var systemDisk = null;
    var systemDataDisk = null;
    var removableDisk = [];

    this.pausePolling = true;

    storage.drives(function (err, drives) {
        if (err) {
            callback && callback(null, err);
            return;
        }

        storage.drivesDetail(drives, function (err, data) {
            if (err) {
                callback && callback(null, err);
                return;
            }

            for(var i = 0; i < data.length; i++) {
                if (data[i].mountpoint === '/' || data[i].mountpoint === 'C:') {
                    systemDisk = data[i];
                }
                else if (path.resolve(SYSTEM.SETTINGS.sys_data_path).indexOf(path.resolve(data[i].mountpoint)) === 0) {
                    systemDataDisk = data[i];
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

                this.systemDataDisk = systemDataDisk;
                if (this.systemDataDisk) {
                    this.systemDataDisk.type = "Data";
                    if (!this.systemDataDisk.uuid)
                        this.systemDataDisk.uuid = uuid.v4();
                }

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
                        if (!this.removableDisk[i].uuid)
                            this.removableDisk[i].uuid = uuid.v4();
                        this.notificationCenter.post("system.storage", "disk.removable.insert", this.removableDisk[i]);
                    }
                }

                for (i = 0; i < _oldDisk.length; i++) {
                    if (!_oldDisk[i].present) {
                        for (j in this.disksInUse) {
                            /* If removed disk is user working disk, reset working disk to system data disk */
                            if (this.disksInUse[j].uuid === _oldDisk[i].uuid) {
                                this.disksInUse[j] = this.getDefaultDiskInUse();
                                this.notificationCenter.post("system.storage", "disk.inuse.change", this.disksInUse[j]);
                            }
                        }
                        this.notificationCenter.post("system.storage", "disk.removable.remove", _oldDisk[i]);
                    }
                }
            }

            callback && callback({ system: this.systemDisk, data: this.systemDataDisk, removable: this.removableDisk });

            this.pausePolling = false;
        }.bind(this));
    }.bind(this));
}

StorageManager.prototype.getDefaultDiskInUse = function() {
    return this.systemDataDisk || this.systemDisk;
}

StorageManager.prototype.getDiskByUUID = function(uuid) {
    if (this.systemDisk && this.systemDisk.uuid === uuid)
        return this.systemDisk;

    if (this.systemDataDisk && this.systemDataDisk.uuid === uuid)
        return this.systemDataDisk;

    for (var i = 0; i < this.removableDisk.length; i++)
        if (this.removableDisk[i].uuid === uuid)
            return this.removableDisk[i];

    return SYSTEM.ERROR.ERROR_STOR_BAD_DISK_INFO;
}

StorageManager.prototype.getUserDataPath = function(socket, _path) {
    var userDataPath;

    if (!socket || !_path)
        return SYSTEM.ERROR.ERROR_INVALID_ARG;

    /* System disk is not allowed to be set as user working disk */
    if (this.disksInUse[socket].uuid === this.systemDisk.uuid)
        userDataPath = SYSTEM.SETTINGS.sys_data_path + this.securityManager.appUserDataDirectory(socket);
    else if (this.disksInUse[socket])
        userDataPath = this.disksInUse[socket].mountpoint + this.securityManager.appUserDataDirectory(socket);
    else
        return SYSTEM.ERROR.ERROR_STOR_DISK_NOT_FOUND;

    try {
        if (!fs.existsSync(userDataPath))
            fs.mkdirsSync(userDataPath);
    }
    catch (error) {
        if (error.code === 'EACCES') {
            /* disksInUse is probably removed */
            return SYSTEM.ERROR.ERROR_SECURITY_ACCESS_DENIED;
        }
        else
            return SYSTEM.ERROR.ERROR_STOR_UNKNOWN;
    }

    return userDataPath + path.sep + path.normalize(_path);
}
