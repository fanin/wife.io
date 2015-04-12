var EventEmitter = require('events').EventEmitter;
var assign       = require('object-assign');
var cbq          = require('./callback-queue');

var StorageManager = assign({}, EventEmitter.prototype, {
    /**
     * Attach File Manager API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        this.socket = _super.ioClient;
        this.wsapi = _super.wsapi[0].Storage;

        /* Dispatch storage wsapi response events */
        this.socket.on(this.wsapi.GetLocalDisks.RES, function(disks) {
            cbq.dequeueApiCallback('storage.getLocalDisks', 'default', function(apiCallback) {
                apiCallback(disks);
                return true;
            });
        });

        this.socket.on(this.wsapi.GetLocalDisks.ERR, function(error) {
            cbq.dequeueApiCallback('storage.getLocalDisks', 'default', function(apiCallback) {
                apiCallback(null, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.SetDiskInUse.RES, function(disk) {
            cbq.dequeueApiCallback('storage.setDiskInUse', 'complete', function(apiCallback) {
                apiCallback(disk);
                return true;
            });
        });

        this.socket.on(this.wsapi.SetDiskInUse.ERR, function(error) {
            cbq.dequeueApiCallback('storage.setDiskInUse', 'error', function(apiCallback) {
                apiCallback(error);
                return true;
            });
        });

        this.socket.on(this.wsapi.GetDiskInUse.RES, function(disk) {
            cbq.dequeueApiCallback('storage.getDiskInUse', 'complete', function(apiCallback) {
                apiCallback(disk);
                return true;
            });
        }),

        this.socket.on(this.wsapi.GetDiskInUse.ERR, function(error) {
            cbq.dequeueApiCallback('storage.getDiskInUse', 'error', function(apiCallback) {
                apiCallback(error);
                return true;
            });
        });
    },

    detach: function() {
        this.socket.removeAllListeners(this.wsapi.GetLocalDisks.RES);
        this.socket.removeAllListeners(this.wsapi.GetLocalDisks.ERR);
        this.socket.removeAllListeners(this.wsapi.SetDiskInUse.RES);
        this.socket.removeAllListeners(this.wsapi.SetDiskInUse.ERR);
        this.socket.removeAllListeners(this.wsapi.GetDiskInUse.RES);
        this.socket.removeAllListeners(this.wsapi.GetDiskInUse.ERR);
    },

    getLocalDisks: function(onComplete) {
        cbq.queueApiCallback('storage.getLocalDisks', 'default', onComplete);
        this.socket.emit(this.wsapi.GetLocalDisks.REQ);
    },

    /* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
    setDiskInUse: function(disk, onComplete, onError) {
        cbq.queueApiCallback('storage.setDiskInUse', 'complete', onComplete);
        cbq.queueApiCallback('storage.setDiskInUse', 'error', onError);
        this.socket.emit(this.wsapi.SetDiskInUse.REQ, disk);
    },

    getDiskInUse: function(onComplete, onError) {
        cbq.queueApiCallback('storage.getDiskInUse', 'complete', onComplete);
        cbq.queueApiCallback('storage.getDiskInUse', 'error', onError);
        this.socket.emit(this.wsapi.GetDiskInUse.REQ);
    }
});

module.exports = StorageManager;
