function StorageClient() {}

extend(StorageClient.prototype, Event.prototype);

StorageClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.protoStorage = _super.protocol[0].Storage;

    /* Dispatch storage protocol response events */
    this.socket.on(this.protoStorage.GetLocalDisks.RES, function(disks) {
        self.event.trigger("storage.localdisk#list#success", disks);
    });

    this.socket.on(this.protoStorage.GetLocalDisks.ERR, function(error) {
        self.event.trigger("storage.localdisk#list#error", error);
    });
}

StorageClient.prototype.detach = function() {
    /* Remove storage protocol response events */
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.RES);
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.ERR);
}

/* Storage client APIs */
StorageClient.prototype.getLocalDisks = function() {
    this.socket.emit(this.protoStorage.GetLocalDisks.REQ);
}
