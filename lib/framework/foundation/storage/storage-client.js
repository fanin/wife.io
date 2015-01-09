function StorageClient() {}

extend(StorageClient.prototype, Event.prototype);

StorageClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.APISpec = _super.apiSpec[0].Storage;
    this.notificationCenter = _super.notificationCenter;

    /* Dispatch storage APISpec response events */
    this.socket.on(this.APISpec.GetLocalDisks.RES, function(disks) {
        self.event.trigger("storage.localdisk#list#success", disks);
    });

    this.socket.on(this.APISpec.GetLocalDisks.ERR, function(error) {
        self.event.trigger("storage.localdisk#list#error", error);
    });

    this.socket.on(this.APISpec.SetUserDataDisk.ERR, function(error) {
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
    /* Remove storage APISpec response events */
    this.socket.removeAllListeners(this.APISpec.GetLocalDisks.RES);
    this.socket.removeAllListeners(this.APISpec.GetLocalDisks.ERR);
    this.socket.removeAllListeners(this.APISpec.SetUserDataDisk.ERR);
    this.notificationCenter.removeObserver("Storage", "DiskInsert");
    this.notificationCenter.removeObserver("Storage", "DiskRemove");
    this.notificationCenter.removeObserver("Storage", "UserDataDiskChange");
    this.notificationCenter.removeObserver("Storage", "Error");
}

/* Storage client APIs */
StorageClient.prototype.getLocalDisks = function() {
    this.socket.emit(this.APISpec.GetLocalDisks.REQ);
}

/* TODO: To implement user data disk usage count to prevent disk being used from removing by another user */
StorageClient.prototype.setUserDataDisk = function(disk) {
    this.socket.emit(this.APISpec.SetUserDataDisk.REQ, disk);
}
