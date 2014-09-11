var storage = require('./lib/disks.js');

module.exports = StorageMonitor;

function StorageMonitor() {
    this.systemDisk = null;
    this.userDisk = null;
    this.removableDisk = [];
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
