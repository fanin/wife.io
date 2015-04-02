var EventEmitter       = require('events').EventEmitter;
var assign             = require('object-assign');
var NotificationCenter = require('./notification-center');

var StorageClient = assign({}, EventEmitter.prototype, {
    /**
     * Attach File Manager API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        var self = this;

        this.socket = _super.ioClient;
        this.wsapi = _super.wsapi[0].Storage;

        /* Dispatch storage wsapi response events */
        this.socket.on(this.wsapi.GetLocalDisks.RES, function(disks) {
            self.emit("storage.localdisk#list#success", disks);
        });

        this.socket.on(this.wsapi.GetLocalDisks.ERR, function(error) {
            self.emit("storage.localdisk#list#error", error);
        });

        this.socket.on(this.wsapi.SetWorkingDisk.ERR, function(error) {
            self.emit("storage.localdisk#setworkingdisk#error", error);
        });

        NotificationCenter.addObserver("Storage", "DiskInsert", function(disk) {
            self.emit("storage.notification#diskinsert", disk);
        });

        NotificationCenter.addObserver("Storage", "DiskRemove", function(disk) {
            self.emit("storage.notification#diskremove", disk);
        });

        NotificationCenter.addObserver("Storage", "WorkingDiskChange", function(disk) {
            self.emit("storage.notification#workingdiskchange", disk);
        });

        NotificationCenter.addObserver("Storage", "WorkingDiskSet", function(disk) {
            self.emit("storage.notification#workingdiskset", disk);
        });

        NotificationCenter.addObserver("Storage", "Error", function(error) {
            self.emit("storage.notification#error", error);
        });
    },

    detach: function() {
        this.socket.removeAllListeners(this.wsapi.GetLocalDisks.RES);
        this.socket.removeAllListeners(this.wsapi.GetLocalDisks.ERR);
        this.socket.removeAllListeners(this.wsapi.SetWorkingDisk.ERR);
        NotificationCenter.removeObserver("Storage", "DiskInsert");
        NotificationCenter.removeObserver("Storage", "DiskRemove");
        NotificationCenter.removeObserver("Storage", "WorkingDiskChange");
        NotificationCenter.removeObserver("Storage", "Error");
    },

    getLocalDisks: function() {
        this.socket.emit(this.wsapi.GetLocalDisks.REQ);
    },

    /* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
    setWorkingDisk: function(disk) {
        this.socket.emit(this.wsapi.SetWorkingDisk.REQ, disk);
    }
});

module.exports = StorageClient;
