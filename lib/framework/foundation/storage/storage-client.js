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

    this.socket.on(this.protoStorage.SetUserDataDisk.ERR, function(error) {
        self.event.trigger("storage.localdisk#setuserdatadisk#error", error);
    });

    this.notificationCenter.addObserver("Storage", "DiskInsert", function(disk) {
        self.event.trigger("storage.notification#diskinsert", disk);
    });

    this.notificationCenter.addObserver("Storage", "DiskRemove", function(disk) {
        self.event.trigger("storage.notification#diskremove", disk);
    });

    this.notificationCenter.addObserver("Storage", "UserDataDiskChange", function(disk) {
        self.event.trigger("storage.notification#userdatadiskchange", disk);
    });

    this.notificationCenter.addObserver("Storage", "UserDataDiskSet", function(disk) {
        self.event.trigger("storage.notification#userdatadiskset", disk);
    });

    this.notificationCenter.addObserver("Storage", "Error", function(error) {
        self.event.trigger("storage.notification#error", error);
    });
}

StorageClient.prototype.detach = function() {
    /* Remove storage protocol response events */
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.RES);
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.ERR);
    this.socket.removeAllListeners(this.protoStorage.SetUserDataDisk.ERR);
    this.notificationCenter.removeObserver("Storage", "DiskInsert");
    this.notificationCenter.removeObserver("Storage", "DiskRemove");
    this.notificationCenter.removeObserver("Storage", "UserDataDiskChange");
    this.notificationCenter.removeObserver("Storage", "Error");
}

/* Storage client APIs */
StorageClient.prototype.getLocalDisks = function() {
    this.socket.emit(this.protoStorage.GetLocalDisks.REQ);
}

/* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
StorageClient.prototype.setUserDataDisk = function(disk) {
    this.socket.emit(this.protoStorage.SetUserDataDisk.REQ, disk);
}
