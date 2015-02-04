"use strict";

var fs = require('fs-extra');
var path = require('path');
var storage = require('./lib/disks.js');
var uuid = require('node-uuid');
var SYSTEM = require('../system');

module.exports = StorageManager;

function StorageManager(_super, apiSpec) {
    this._super = _super;
    this.APISpec = apiSpec;
    this.notificationCenter = _super.notificationCenter;
    this.securityManager = _super.securityManager;
    this.systemDisk = null;
    this.systemDataDisk = null;
    this.userWorkingDisk = [];
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
    var self = this;

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(self.APISpec.GetLocalDisks.REQ, function() {
        self.getLocalDisks(function(disks, error) {
            if (error) {
                socket.emit(self.APISpec.GetLocalDisks.ERR, SYSTEM.ERROR.ERROR_STOR_DISK_API);
            }
            else {
                if (!disks.system) {
                    socket.emit(self.APISpec.GetLocalDisks.ERR, SYSTEM.ERROR.ERROR_STOR_DISK_NOT_FOUND);
                }

                socket.emit(self.APISpec.GetLocalDisks.RES, disks);
            }

            self.pausePolling = false;
        });
    });

    socket.on(self.APISpec.SetUserDataDisk.REQ, function(disk) {
        if (self.securityManager.isExternalUserDataAllowed(socket)) {
            if (self.verifyDiskInfo(disk)) {
                if (self.userWorkingDisk[socket].mountpoint !== disk.mountpoint) {
                    self.userWorkingDisk[socket] = disk;
                    self.notificationCenter.post("Storage", "UserDataDiskChange", disk);
                }
                self.notificationCenter.post("Storage", "UserDataDiskSet", disk);
            }
            else
                socket.emit(self.APISpec.SetUserDataDisk.ERR, SYSTEM.ERROR.ERROR_STOR_BAD_DISK_INFO);
        }
        else
            socket.emit(self.APISpec.SetUserDataDisk.ERR, SYSTEM.ERROR.ERROR_SECURITY_EXTERNAL_NOT_ALLOWED);
    });

    self.getLocalDisks(function(disks, error) {
        if (error) {
            self.notificationCenter.post("Storage", "Error", error);
            self.pausePolling = true;
        }
        /* Examine SystemDataPath */
        else if (!fs.existsSync(SYSTEM.SETTINGS.SystemDataPath)) {
            error = SYSTEM.ERROR.ERROR_STOR_SYSDISK_NOT_FOUND;
            self.notificationCenter.post("Storage", "Error", error);
            self.pausePolling = true;
        }
        else {
            try {
                /* Test SystemDataPath write permission */
                fs.createFileSync(SYSTEM.SETTINGS.SystemDataPath + "/test");
                fs.removeSync(SYSTEM.SETTINGS.SystemDataPath + "/test");

                /* If user working disk for the client is not set, set to system disk by default */
                if (!self.userWorkingDisk[socket])
                    self.userWorkingDisk[socket] = self.systemDataDisk || self.systemDisk;
            }
            catch (e) {
                error = e.code;
                self.notificationCenter.post("Storage", "Error", error);
            }
        }

        complete && complete(error);
    });
}

StorageManager.prototype.unregister = function(socket) {
    socket.removeAllListeners(this.APISpec.GetLocalDisks.REQ);
    if (this.userWorkingDisk[socket])
        this.userWorkingDisk[socket] = undefined;
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
    var self = this;
    var systemDisk = null;
    var systemDataDisk = null;
    var removableDisk = [];

    self.pausePolling = true;

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
                else if (path.resolve(SYSTEM.SETTINGS.SystemDataPath).indexOf(path.resolve(data[i].mountpoint)) === 0) {
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
            if (self.systemDisk === null) {
                /* This is the first time getting disks info */
                self.systemDisk = systemDisk;
                if (self.systemDisk) {
                    self.systemDisk.type = "System";
                    if (!self.systemDisk.uuid)
                        self.systemDisk.uuid = uuid.v4();
                }

                self.systemDataDisk = systemDataDisk;
                if (self.systemDataDisk) {
                    self.systemDataDisk.type = "Data";
                    if (!self.systemDataDisk.uuid)
                        self.systemDataDisk.uuid = uuid.v4();
                }

                self.removableDisk = removableDisk;
                for (i = 0; i < self.removableDisk.length; i++) {
                    self.removableDisk[i].type = "Removable";
                    if (!self.removableDisk[i].uuid)
                        self.removableDisk[i].uuid = uuid.v4();
                }
            }
            else {
                /* Backup previous removable disks array to examine disk insertion/removal */
                var _oldDisk = self.removableDisk;
                self.removableDisk = removableDisk;

                /* Set disk type */
                for (var i = 0; i < self.removableDisk.length; i++) {
                    self.removableDisk[i].type = "Removable";
                }

                /* Reset present flag */
                for (var j = 0; j < _oldDisk.length; j++) {
                    _oldDisk[j].present = false;
                }

                /* Examine if removable disk array changes */
                for (i = 0; i < self.removableDisk.length; i++) {
                    for (j = 0; j < _oldDisk.length; j++) {
                        /* To compare two disks by their mountpoint and total capacity */
                        if (self.removableDisk[i].mountpoint === _oldDisk[j].mountpoint &&
                            self.removableDisk[i].total === _oldDisk[j].total) {
                            self.removableDisk[i].uuid = self.removableDisk[i].uuid || _oldDisk[j].uuid;
                            self.removableDisk[i].present = true;
                            _oldDisk[j].present = true;
                        }
                    }
                }

                for (i = 0; i < self.removableDisk.length; i++) {
                    if (!self.removableDisk[i].present) {
                        self.removableDisk[i].type = "Removable";
                        /* Create a fake uuid if there's no uuid found for the disk */
                        if (!self.removableDisk[i].uuid)
                            self.removableDisk[i].uuid = uuid.v4();
                        self.notificationCenter.post("Storage", "DiskInsert", self.removableDisk[i]);
                    }
                }

                for (i = 0; i < _oldDisk.length; i++) {
                    if (!_oldDisk[i].present) {
                        for (j in self.userWorkingDisk) {
                            /* If removed disk is user working disk, reset working disk to system disk */
                            if (self.userWorkingDisk[j] === _oldDisk[i]) {
                                self.userWorkingDisk[j] = self.systemDataDisk || self.systemDisk;
                            }
                        }
                        self.notificationCenter.post("Storage", "DiskRemove", _oldDisk[i]);
                    }
                }
            }

            callback && callback({ system: self.systemDisk, data: self.systemDataDisk, removable: self.removableDisk });
        });
    });
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

    if (this.userWorkingDisk[socket].uuid === this.systemDisk.uuid)
        userDataPath = SYSTEM.SETTINGS.SystemDataPath + this.securityManager.appUserDataDirectory(socket);
    else if (this.userWorkingDisk[socket])
        userDataPath = this.userWorkingDisk[socket].mountpoint + this.securityManager.appUserDataDirectory(socket);
    else
        return SYSTEM.ERROR.ERROR_STOR_DISK_NOT_FOUND;

    try {
        if (!fs.existsSync(userDataPath))
            fs.mkdirsSync(userDataPath);
    }
    catch (error) {
        if (error.code === 'EACCES') {
            /* userWorkingDisk is probably removed */
            return SYSTEM.ERROR.ERROR_SECURITY_ACCESS_DENIED;
        }
        else
            return SYSTEM.ERROR.ERROR_STOR_UNKNOWN;
    }

    return userDataPath + path.sep + path.normalize(_path);
}
