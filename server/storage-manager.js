var storage = require('./lib/disks.js');
var SYSTEM = require('../system');

module.exports = StorageManager;

function StorageManager() {
    this.systemDisk = null;
    this.userDisk = null;
    this.removableDisk = [];
}

StorageManager.prototype.register = function(_super, socket, protoStorage) {
    var self = this;
    var security = _super.securityManager[socket];

    self.socket = socket;
    self.protoStorage = protoStorage;
    self.notificationCenter = _super.notificationCenter;

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(protoStorage.GetLocalDisks.REQ, function() {
        self.getLocalDisks(function(disks) {
            if (!disks.system) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorSystemDiskNotFound);
            }

            if (!disks.user) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorUserDiskNotFound);
            }

            socket.emit(protoStorage.GetLocalDisks.RES, disks);
        });
    });

    /* Start disk monitor */
    self.diskMonitorTimer = setInterval(function() {
        self.getLocalDisks();
    }, 1500);
}

StorageManager.prototype.unregister = function(socket, protoStorage) {
    clearInterval(this.diskMonitorTimer);
    socket.removeAllListeners(protoStorage.GetLocalDisks.REQ);
}

StorageManager.prototype.getLocalDisks = function(callback) {
    var self = this;
    var systemDisk = null;
    var userDisk = null;
    var removableDisk = [];

    storage.drives(function (err, drives) {
        storage.drivesDetail(drives, function (err, data) {
            for(var i = 0; i < data.length; i++) {
                if (data[i].mountpoint === '/') {
                    systemDisk = data[i];
                }
                else if (data[i].mountpoint.indexOf('/home') >= 0) {
                    userDisk = data[i];
                }
                else if (data[i].mountpoint.indexOf('/mnt') === 0 ||
                         data[i].mountpoint.indexOf('/media') === 0 ||
                         data[i].mountpoint.indexOf('/Volumes') === 0) {
                    removableDisk.push(data[i]);
                }
            }

            callback && callback({ system: systemDisk, user: userDisk, removable: removableDisk });

            /* Save disk status */
            if (self.systemDisk === null) {
                self.systemDisk = systemDisk;
                self.userDisk = userDisk;
                self.removableDisk = removableDisk;
            }
            else {
                self.systemDisk = systemDisk;
                self.userDisk = userDisk;
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
        });
    });
};
