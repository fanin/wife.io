var fs = require('fs-extra');
var path = require('path');
var storage = require('./lib/disks.js');
var uuid = require('node-uuid');
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
    self.pausePolling = false;

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(protoStorage.GetLocalDisks.REQ, function() {
        self.getLocalDisks(function(disks, error) {
            if (error) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorDiskApiError);
            }
            else {
                if (!disks.system) {
                    socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorSystemDiskNotFound);
                }

                if (!disks.user) {
                    socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorUserDiskNotFound);
                }

                socket.emit(protoStorage.GetLocalDisks.RES, disks);
            }

            self.pausePolling = false;
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
                if (self.userDataDisk[socket].mountpoint !== disk.mountpoint) {
                    self.userDataDisk[socket] = disk;
                    self.notificationCenter.post("Storage", "UserDataDiskChange", disk);
                }
                self.notificationCenter.post("Storage", "UserDataDiskSet", disk);
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
        self.pausePolling = false;
        complete && complete(error);
    });

    /*
     * Start disk monitor
     * FIXME: Integrate with system disk event instead of polling
     */
    self.diskMonitorTimer = setInterval(function() {
        if (!self.pausePolling) {
            self.getLocalDisks(function(disks, error) {
                self.pausePolling = false;
            });
        }
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
                if (!self.systemDisk.uuid)
                    self.systemDisk.uuid = uuid.v4();

                self.userDisk = userDisk;
                if (!self.userDisk.uuid)
                    self.userDisk.uuid = uuid.v4();

                self.userDataDisk[self.socket] = userDisk;

                self.removableDisk = removableDisk;
                for (i = 0; i < self.removableDisk.length; i++)
                    if (!self.removableDisk[i].uuid)
                        self.removableDisk[i].uuid = uuid.v4();
            }
            else {
                /* Create a fake uuid if there's no uuid found for the disk */
                if (!systemDisk.uuid)
                    systemDisk.uuid = self.systemDisk.uuid;
                self.systemDisk = systemDisk;

                /* If there's no user disk found, post an error notification to client */
                if (self.userDisk && !userDisk)
                    self.notificationCenter.post("Storage", "Error", SYSTEM.ERROR.StorUserDiskNotFound);

                /* Create a fake uuid if there's no uuid found for the disk */
                if (!userDisk.uuid)
                    userDisk.uuid = self.userDisk.uuid;
                self.userDisk = userDisk;

                /* If user data disk for the client is not set, set to user disk by default */
                if (!self.userDataDisk[self.socket])
                    self.userDataDisk[self.socket] = self.userDisk;

                /* Backup previous removable disks array to examine disk insertion/removal */
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
                        /* To compare two disks by their mountpoint and total capacity */
                        if (self.removableDisk[i].mountpoint === _oldDisk[j].mountpoint &&
                            self.removableDisk[i].total === _oldDisk[j].total) {
                            self.removableDisk[i].present = true;
                            _oldDisk[j].present = true;
                        }
                    }
                }

                for (i = 0; i < self.removableDisk.length; i++) {
                    if (!self.removableDisk[i].present) {
                        /* Create a fake uuid if there's no uuid found for the disk */
                        if (!self.removableDisk[i].uuid)
                            self.removableDisk[i].uuid = uuid.v4();
                        self.notificationCenter.post("Storage", "DiskInsert", self.removableDisk[i]);
                    }
                }

                for (i = 0; i < _oldDisk.length; i++) {
                    if (!_oldDisk[i].present) {
                        if (self.userDataDisk[self.socket] === _oldDisk[i]) {
                            self.userDataDisk[self.socket] = self.userDisk;
                        }
                        self.notificationCenter.post("Storage", "DiskRemove", _oldDisk[i]);
                    }
                }
            }

            callback && callback({ system: self.systemDisk, user: self.userDisk, removable: self.removableDisk });
        });
    });
}

StorageManager.prototype.getUserDataPath = function(path) {
    var userDataPath;

    if (this.userDataDisk[this.socket]) {
        userDataPath = this.userDataDisk[this.socket].mountpoint + this.securityManager.appUserDataDirectory(this.socket);
    }
    else
        return SYSTEM.ERROR.StorUserDiskNotFound;

    try {
        if (!fs.existsSync(userDataPath))
            fs.mkdirsSync(userDataPath);
    }
    catch (error) {
        if (error.code === 'EACCES') {
            /* userDataDisk is probably removed */
            return SYSTEM.ERROR.SecurityAccessDenied;
        }
        else
            return SYSTEM.ERROR.StorUnknownError;
    }

    return userDataPath + '/' + path;
}
