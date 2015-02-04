var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var NotificationCenter = require('./notification-center');

var StorageClient = assign({}, EventEmitter.prototype, {
    /**
     * Attach File Manager API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        var self = this;

        this.socket = _super.ioClient;
        this.APISpec = _super.apiSpec[0].Storage;

        /* Dispatch storage APISpec response events */
        this.socket.on(this.APISpec.GetLocalDisks.RES, function(disks) {
            self.emit("storage.localdisk#list#success", disks);
        });

        this.socket.on(this.APISpec.GetLocalDisks.ERR, function(error) {
            self.emit("storage.localdisk#list#error", error);
        });

        this.socket.on(this.APISpec.SetUserDataDisk.ERR, function(error) {
            self.emit("storage.localdisk#setuserdatadisk#error", error);
        });

        NotificationCenter.addObserver("Storage", "DiskInsert", function(disk) {
            self.emit("storage.notification#diskinsert", disk);
        });

        NotificationCenter.addObserver("Storage", "DiskRemove", function(disk) {
            self.emit("storage.notification#diskremove", disk);
        });

        NotificationCenter.addObserver("Storage", "UserDataDiskChange", function(disk) {
            self.emit("storage.notification#userdatadiskchange", disk);
        });

        NotificationCenter.addObserver("Storage", "UserDataDiskSet", function(disk) {
            self.emit("storage.notification#userdatadiskset", disk);
        });

        NotificationCenter.addObserver("Storage", "Error", function(error) {
            self.emit("storage.notification#error", error);
        });
    },

    detach: function() {
        this.socket.removeAllListeners(this.APISpec.GetLocalDisks.RES);
        this.socket.removeAllListeners(this.APISpec.GetLocalDisks.ERR);
        this.socket.removeAllListeners(this.APISpec.SetUserDataDisk.ERR);
        NotificationCenter.removeObserver("Storage", "DiskInsert");
        NotificationCenter.removeObserver("Storage", "DiskRemove");
        NotificationCenter.removeObserver("Storage", "UserDataDiskChange");
        NotificationCenter.removeObserver("Storage", "Error");
    },

    getLocalDisks: function() {
        this.socket.emit(this.APISpec.GetLocalDisks.REQ);
    },

    /* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
    setUserDataDisk: function(disk) {
        this.socket.emit(this.APISpec.SetUserDataDisk.REQ, disk);
    }
});

module.exports = StorageClient;
