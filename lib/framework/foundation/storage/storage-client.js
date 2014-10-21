function StorageClient() {}

StorageClient.prototype.register = function(_super) {
    var self = this;

    this.delegate = _super;
    this.socket = _super.ioClient;
    this.protoStorage = _super.protocol[0].Storage;

    /* Dispatch storage protocol response events */
    this.socket.on(this.protoStorage.GetLocalDisks.RES, function(disks) {
        self.localDisks = disks;
        self.delegate.localDisksDidLoad();
    });

    this.socket.on(this.protoStorage.GetLocalDisks.ERR, function(error) {
        self.delegate.storageDidFailGetLocalDisksWithError(error);
    });
}

StorageClient.prototype.unregister = function() {
    /* Remove storage protocol response events */
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.RES);
    this.socket.removeAllListeners(this.protoStorage.GetLocalDisks.ERR);
}

/* Storage client APIs */
StorageClient.prototype.getLocalDisks = function() {
    this.socket.emit(this.protoStorage.GetLocalDisks.REQ);
}
