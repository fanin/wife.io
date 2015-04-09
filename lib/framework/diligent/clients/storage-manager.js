var EventEmitter = require('events').EventEmitter;
var assign       = require('object-assign');
var cbq          = require('./callback-queue');

var StorageManager = assign({}, EventEmitter.prototype, {
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
            //self.emit("storage.localdisk#list#success", disks);
            cbq.dequeueApiCallback('storage.getLocalDisks', 'default', function(apiCallback) {
                apiCallback(disks);
                return true;
            });
        });

        this.socket.on(this.wsapi.GetLocalDisks.ERR, function(error) {
            //self.emit("storage.localdisk#list#error", error);
            cbq.dequeueApiCallback('storage.getLocalDisks', 'default', function(apiCallback) {
                apiCallback(null, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.SetWorkingDisk.ERR, function(error) {
            //self.emit("storage.localdisk#setworkingdisk#error", error);
            cbq.dequeueApiCallback('storage.setWorkingDisk', 'default', function(apiCallback) {
                apiCallback(error);
                return true;
            });
        });
    },

    detach: function() {
        this.socket.removeAllListeners(this.wsapi.GetLocalDisks.RES);
        this.socket.removeAllListeners(this.wsapi.GetLocalDisks.ERR);
        this.socket.removeAllListeners(this.wsapi.SetWorkingDisk.ERR);
    },

    getLocalDisks: function(onComplete) {
        cbq.queueApiCallback('storage.getLocalDisks', 'default', onComplete);
        this.socket.emit(this.wsapi.GetLocalDisks.REQ);
    },

    /* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
    setWorkingDisk: function(disk, onError) {
        cbq.queueApiCallback('storage.setWorkingDisk', 'default', onError);
        this.socket.emit(this.wsapi.SetWorkingDisk.REQ, disk);
    }
});

module.exports = StorageManager;
