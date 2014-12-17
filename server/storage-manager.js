var fs = require('fs-extra');
var path = require('path');
var storage = require('./lib/disks.js');
var SYSTEM = require('../system');

module.exports = StorageManager;

function StorageManager() {}

StorageManager.prototype.register = function(_super, socket, protoStorage, complete) {
    var self = this;

    self.systemDisk = null;
    self.userDisk = null;
    self.userDataDisk = [];
    self.removableDisk = [];
    self.socket = socket;
    self.protoStorage = protoStorage;
    self.notificationCenter = _super.notificationCenter;
    self.securityManager = _super.securityManager;

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(protoStorage.GetLocalDisks.REQ, function() {
        self.getLocalDisks(function(disks, error) {
            if (error) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorDiskApiError);
                return;
            }

            if (!disks.system) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorSystemDiskNotFound);
            }

            if (!disks.user) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorUserDiskNotFound);
            }

            socket.emit(protoStorage.GetLocalDisks.RES, disks);
        });
    });

    socket.on(protoStorage.SetUserDisk.REQ, function(disk) {
        if (self.verifyDiskInfo(disk) && disk.type !== "System") {
            if (self.userDisk.mountpoint !== disk.mountpoint) {
                self.userDisk = disk;
                self.notificationCenter.post("Storage", "UserDiskChange", disk);
            }
            else
                self.userDisk = disk;
        }
        else
            socket.emit(protoStorage.SetUserDisk.ERR, SYSTEM.ERROR.StorBadDiskInfo);
    });

    socket.on(protoStorage.SetUserDataDisk.REQ, function(disk) {
        if (self.securityManager.isExternalUserDataAllowed(socket)) {
            if (self.verifyDiskInfo(disk) && disk.type !== "System") {
                if (!self.userDataDisk[socket] || self.userDataDisk[socket].mountpoint !== disk.mountpoint) {
                    self.userDataDisk[socket] = disk;
                    self.notificationCenter.post("Storage", "UserDataDiskChange", disk);
                }
            }
            else
                socket.emit(protoStorage.SetUserDataDisk.ERR, SYSTEM.ERROR.StorBadDiskInfo);
        }
        else
            socket.emit(protoStorage.SetUserDataDisk.ERR, SYSTEM.ERROR.SecurityExternalNotAllowed);
    });

    self.getLocalDisks(function(disks, error) {
        if (!error) {
            if (!self.userDisk) {
                self.notificationCenter.post("Storage", "Error", SYSTEM.ERROR.StorUserDiskNotFound);
                error = true;
            }
        }
        else
            self.notificationCenter.post("Storage", "Error", error);

        complete && complete(error);
    });

    /*
     * Start disk monitor
     * FIXME: Integrate with system disk event instead of polling
     */
    self.diskMonitorTimer = setInterval(function() {
        self.getLocalDisks();
    }, 1500);
}

StorageManager.prototype.unregister = function(socket, protoStorage) {
    clearInterval(this.diskMonitorTimer);
    socket.removeAllListeners(protoStorage.GetLocalDisks.REQ);
    if (this.userDataDisk[socket])
        this.userDataDisk[socket] = undefined;
}

StorageManager.prototype.verifyDiskInfo = function(disk) {
    if (!disk) return false;
    if (!disk.type) return false;
    if (!disk.mountpoint) return false;
    if (disk.total === undefined) return false;
    if (disk.available === undefined) return false;
    if (disk.used === undefined) return false;
    return true;
}

StorageManager.prototype.getLocalDisks = function(callback) {
    var self = this;
    var systemDisk = null;
    var userDisk = null;
    var removableDisk = [];

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
                if (data[i].mountpoint === '/') {
                    systemDisk = data[i];
                }
                else if (path.normalize(data[i].mountpoint) === path.normalize(SYSTEM.SETTINGS.UserStorageMountpoint)) {
                    userDisk = data[i];
                }
                else if (data[i].mountpoint.indexOf('/mnt') === 0 ||
                         data[i].mountpoint.indexOf('/media') === 0 ||
                         data[i].mountpoint.indexOf('/Volumes') === 0) {
                    removableDisk.push(data[i]);
                }
            }

            /* Save disk status */
            if (self.systemDisk === null) {
                self.systemDisk = systemDisk;
                self.userDisk = userDisk;
                self.userDataDisk[self.socket] = userDisk;
                self.removableDisk = removableDisk;
            }
            else {
                self.systemDisk = systemDisk;

                if (self.userDisk && !userDisk)
                    self.notificationCenter.post("Storage", "Error", SYSTEM.ERROR.StorUserDiskNotFound);
                self.userDisk = userDisk;
                if (!self.userDataDisk[self.socket])
                    self.userDataDisk[self.socket] = self.userDisk;

                var _oldDisk = self.removableDisk;
                self.removableDisk = removableDisk;

                /* Set disk type */
                if (self.systemDisk)
                    self.systemDisk.type = "System";
                if (self.userDisk)
                    self.userDisk.type = "User";
                for (i = 0; i < self.removableDisk.length; i++)
                    self.removableDisk[i].type = "Removable";

                /* Reset present flag */
                for (var i = 0; i < _oldDisk.length; i++) {
                    _oldDisk[i].present = false;
                }

                /* Examine if removable disk array changes */
                for (i = 0; i < self.removableDisk.length; i++) {
                    for (var j = 0; j < _oldDisk.length; j++) {
                        if (self.removableDisk[i].mountpoint === _oldDisk[j].mountpoint && self.removableDisk[i].total === _oldDisk[j].total) {
                            self.removableDisk[i].present = true;
                            _oldDisk[j].present = true;
                        }
                    }
                }

                for (i = 0; i < self.removableDisk.length; i++) {
                    if (!self.removableDisk[i].present)
                        self.notificationCenter.post("Storage", "DiskInsert", self.removableDisk[i]);
                }

                for (i = 0; i < _oldDisk.length; i++) {
                    if (!_oldDisk[i].present)
                        self.notificationCenter.post("Storage", "DiskRemove", _oldDisk[i]);
                }
            }

            callback && callback({ system: self.systemDisk, user: self.userDisk, removable: self.removableDisk });
        });
    });
}

StorageManager.prototype.getUserDataPath = function(path) {
    var userDataPath;

    if (this.userDataDisk[this.socket])
        userDataPath = this.userDataDisk[this.socket].mountpoint + this.securityManager.appUserDataDirectory(this.socket);
    else
        return SYSTEM.ERROR.StorUserDiskNotFound;

    if (!fs.existsSync(userDataPath))
        fs.mkdirsSync(userDataPath);

    return userDataPath + '/' + path;
}
