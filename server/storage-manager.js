var fs = require('fs-extra');
var path = require('path');
var storage = require('./lib/disks.js');
var SYSTEM = require('../system');

module.exports = StorageManager;

function StorageManager() {
    this.systemDisk = null;
    this.userDisk = null;
    this.userDataDisk = null;
    this.removableDisk = [];
}

StorageManager.prototype.register = function(_super, socket, protoStorage, complete) {
    var self = this;

    self.socket = socket;
    self.protoStorage = protoStorage;
    self.notificationCenter = _super.notificationCenter;
    self.securityManager = _super.securityManager[socket];

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
        if (self.verifyDiskInfo(disk) && disk.type !== "System")
            self.userDisk = disk;
        else
            socket.emit(protoStorage.SetUserDisk.ERR, SYSTEM.ERROR.StorBadDiskInfo);
    });

    socket.on(protoStorage.SetUserDataDisk.REQ, function(disk) {
        if (self.securityManager.isExternalUserDataAllowed()) {
            if (self.verifyDiskInfo(disk) && disk.type !== "System")
                self.userDataDisk = disk;
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
     * TODO: Integrate with system disk event instead of polling
     */
    self.diskMonitorTimer = setInterval(function() {
        self.getLocalDisks();
    }, 1500);
}

StorageManager.prototype.unregister = function(socket, protoStorage) {
    clearInterval(this.diskMonitorTimer);
    socket.removeAllListeners(protoStorage.GetLocalDisks.REQ);
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
                self.userDataDisk = userDisk;
                self.removableDisk = removableDisk;
            }
            else {
                self.systemDisk = systemDisk;

                if (self.userDisk && !userDisk)
                    self.notificationCenter.post("Storage", "Error", SYSTEM.ERROR.StorUserDiskNotFound);
                self.userDisk = userDisk;
                if (!self.userDataDisk)
                    self.userDataDisk = self.userDisk;

                var _oldDisk = self.removableDisk;
                self.removableDisk = removableDisk;

                /* Reset present flag */
                for (var i = 0; i < _oldDisk.length; i++) {
                    _oldDisk[i].present = false;
                }

                /* Examine if removable disk array changes */
                for (i = 0; i < removableDisk.length; i++) {
                    for (var j = 0; j < _oldDisk.length; j++) {
                        if (removableDisk[i].mountpoint === _oldDisk[j].mountpoint && removableDisk[i].total === _oldDisk[j].total) {
                            removableDisk[i].present = true;
                            _oldDisk[j].present = true;
                        }
                    }
                }

                for (i = 0; i < removableDisk.length; i++) {
                    if (!removableDisk[i].present)
                        self.notificationCenter.post("Storage", "DiskAdded", removableDisk[i]);
                }

                for (i = 0; i < _oldDisk.length; i++) {
                    if (!_oldDisk[i].present)
                        self.notificationCenter.post("Storage", "DiskRemoved", _oldDisk[i]);
                }
            }

            if (self.systemDisk)
                self.systemDisk.type = "System";
            if (self.userDisk)
                self.userDisk.type = "User";
            for (i = 0; i < self.removableDisk.length; i++)
                self.removableDisk[i].type = "Removable";

            callback && callback({ system: self.systemDisk, user: self.userDisk, removable: self.removableDisk });
        });
    });
}

StorageManager.prototype.buildUserDataPath = function(path) {
    var userDataPath;

    if (this.userDisk)
        userDataPath = this.userDataDisk.mountpoint + this.securityManager.appUserDataDirectory();
    else
        return SYSTEM.ERROR.StorUserDiskNotFound;

    if (!fs.existsSync(userDataPath))
        fs.mkdirsSync(userDataPath);

    return userDataPath + '/' + path;
}
