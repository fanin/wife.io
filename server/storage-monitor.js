var storage = require('./lib/disks.js');
var SYSTEM = require('../system');

module.exports = StorageMonitor;

function StorageMonitor() {
    this.systemDisk = null;
    this.userDisk = null;
    this.removableDisk = [];
}

StorageMonitor.prototype.register = function(_super, socket, protoStorage) {
    var self = this;
    var security = _super.securityManager[socket];

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(protoStorage.GetLocalDisks.REQ, function() {
        self.retrieveLocalDisks(function() {
            if (!self.systemDisk) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorSystemDiskNotFound);
            }

            if (!self.userDisk) {
                socket.emit(protoStorage.GetLocalDisks.ERR, SYSTEM.ERROR.StorUserDiskNotFound);
            }

            socket.emit(protoStorage.GetLocalDisks.RES, {
                system: self.systemDisk,
                user: self.userDisk,
                removable: self.removableDisk
            });
        });
    });
}

StorageMonitor.prototype.unregister = function(socket, protoStorage) {
    socket.removeAllListeners(protoStorage.GetLocalDisks.REQ);
}

StorageMonitor.prototype.retrieveLocalDisks = function(callback) {
    var self = this;
    self.systemDisk = null;
    self.userDisk = null;
    self.removableDisk = [];

    storage.drives(function (err, drives) {
        storage.drivesDetail(drives, function (err, data) {
            for(var i = 0; i < data.length; i++) {
                if (data[i].mountpoint == '/') {
                    self.systemDisk = data[i];
                }
                else if (data[i].mountpoint.indexOf('/home') >= 0) {
                    self.userDisk = data[i];
                }
                else if (data[i].mountpoint.indexOf('/mnt') == 0 ||
                         data[i].mountpoint.indexOf('/media') == 0 ||
                         data[i].mountpoint.indexOf('/Volumes') == 0) {
                    self.removableDisk.push(data[i]);
                }
            }
            callback();
        });
    });
};
