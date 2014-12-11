function StorageClient() {}

extend(StorageClient.prototype, Event.prototype);

StorageClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.protoStorage = _super.protocol[0].Storage;
    this.notificationCenter = _super.notificationCenter;

    /* Dispatch storage protocol response events */
    this.socket.on(this.protoStorage.GetLocalDisks.RES, function(disks) {
        self.event.trigger("storage.localdisk#list#success", disks);
    });

    this.socket.on(this.protoStorage.GetLocalDisks.ERR, function(error) {
        self.event.trigger("storage.localdisk#list#error", error);
    });

    this.socket.on(this.protoStorage.SetUserDisk.ERR, function(error) {
        self.event.trigger("storage.localdisk#setuserdisk#error", error);
    });

    this.socket.on(this.protoStorage.SetUserDataDisk.ERR, function(error) {
        self.event.trigger("storage.localdisk#setuserdatadisk#error", error);
    });

    this.notificationCenter.addObserver("Storage", "DiskAdded", function(disk) {
        self.event.trigger("storage.notification#diskadded", disk);
    });

    this.notificationCenter.addObserver("Storage", "DiskRemoved", function(disk) {
        self.event.trigger("storage.notification#diskremoved", disk);
    });

    this.notificationCenter.addObserver("Storage", "Error", function(error) {
        self.event.trigger("storage.notification#error", error);
    });
}

StorageClient.prototype.detach = function() {
    /* Remove storage protocol response events */
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.RES);
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.ERR);
    this.socket.removeAllListeners(this.protoStorage.SetUserDisk.ERR);
    this.socket.removeAllListeners(this.protoStorage.SetUserDataDisk.ERR);
    this.notificationCenter.removeObserver("Storage", "DiskAdded");
    this.notificationCenter.removeObserver("Storage", "DiskRemoved");
}

/* Storage client APIs */
StorageClient.prototype.getLocalDisks = function() {
    this.socket.emit(this.protoStorage.GetLocalDisks.REQ);
}

/* TODO: To change user disk, user must have administrator permission */
StorageClient.prototype.setUserDisk = function(disk) {
    this.socket.emit(this.protoStorage.SetUserDisk.REQ, disk);
}

/* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
StorageClient.prototype.setUserDataDisk = function(disk) {
    this.socket.emit(this.protoStorage.SetUserDataDisk.REQ, disk);
}
