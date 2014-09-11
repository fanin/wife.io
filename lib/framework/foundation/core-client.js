function CoreClient() {
    this.ioClient = undefined;
    this.protocol = undefined;
    this.delegate = undefined;
};

CoreClient.prototype.initiate = function(protoSpec) {
    if (this.loadProtoSpec(protoSpec)) {
        this.registerSioListeners(this.ioClient);
        this.registerProtoListeners(this.ioClient);
    }
    else alert('CoreClient error');
}

CoreClient.prototype.loadProtoSpec = function(protoSpec) {
    var self = this;
    var result = false;

    if (!protoSpec)
        protoSpec = 'ProtoSpec-v0';

    $.ajax({
        url: 'http://%SYSIP%:8001/protocol/' + protoSpec + '.json',
        dataType: 'text',
        async: false,
        success: function(data) {
            try {
                self.protocol = $.parseJSON(data);
                self.delegate && self.delegate.protoResponseProtoLoaded(self);

                /* Using 'forceNew' attribute to fix connect->disconnect->connect fail problem */
                self.ioClient = io('http://%SYSIP%:8001', { 'forceNew': true, 'pingTimeout': 300000 });

                result = true;
            }
            catch (error) {
                self.delegate && self.delegate.protoErrorProtoLoad(self, error);
            }
        }
    });

    return result;
}

CoreClient.prototype.loadExtProtoSpec = function(protoSpec) {
    var self = this;
    var result = false;

    if (!protoSpec)
        return result;

    $.ajax({
        url: "http://%SYSIP%:8001/protocol/" + protoSpec + ".json",
        dataType: "text",
        async: false,
        success: function(data) {
            try {
                self.protocol.extension = $.parseJSON(data);
                self.delegate && self.delegate.protoResponseExtProtoLoaded(self);
                result = true;
            }
            catch (error) {
                self.delegate && self.delegate.protoErrorExtProtoLoad(self, error);
            }
        }
    });

    return result;
}

CoreClient.prototype.registerSioListeners = function(socket) {
    var self = this;

    socket.on('connect', function() {
        self.delegate && self.delegate.connectionEstablished(self);
    });

    socket.on('disconnect', function() {
        self.unregisterProtoListeners(socket);
        self.unregisterSioListeners(socket);
        self.delegate && self.delegate.connectionClosed(self);
    });

    socket.on('connect_error', function(error) {
        self.delegate && self.delegate.connectionFailWithError(self, error);
    });
}

CoreClient.prototype.unregisterSioListeners = function(socket) {
    socket.removeAllListeners('connect');
    socket.removeAllListeners('disconnect');
    socket.removeAllListeners('connect_error');
}

CoreClient.prototype.registerProtoListeners = function(socket) {
    var self = this;

    /* Dispatch APP protocol response events */
    socket.on(self.protocol.Response[0].APP.List, function(apps) {
        self.delegate && self.delegate.protoResponseAppList(self, apps);
    });

    socket.on(self.protocol.Response[0].APP.Installing, function(appBundle) {
        self.delegate && self.delegate.protoResponseAppInstalling(self, appBundle);
    });

    socket.on(self.protocol.Response[0].APP.Installed, function(appBundle) {
        self.delegate && self.delegate.protoResponseAppInstalled(self, appBundle);
    });

    socket.on(self.protocol.Response[0].APP.InstallCancelled, function(appBundle) {
        self.delegate && self.delegate.protoResponseAppInstallCancelled(self, appBundle);
    });

    socket.on(self.protocol.Response[0].APP.Uninstalled, function(appDirectory) {
        self.delegate && self.delegate.protoResponseAppUninstalled(self, appDirectory);
    });

    socket.on(self.protocol.Error[0].APP.Install, function(error) {
        self.delegate && self.delegate.protoErrorAppInstall(self, error);
    });

    socket.on(self.protocol.Error[0].APP.Uninstall, function(error) {
        self.delegate && self.delegate.protoErrorAppUninstall(self, error);
    });

    /* Dispatch storage protocol response events */
    socket.on(self.protocol.Response[0].Storage.LocalDisks, function(disks) {
        self.delegate && self.delegate.protoResponseLocalDisks(self, disks);
    });

    socket.on(self.protocol.Error[0].Storage.GetLocalDisks, function(error) {
        self.delegate && self.delegate.protoErrorGetLocalDisks(self, error);
    });
}

CoreClient.prototype.unregisterProtoListeners = function(socket) {
    /* Remove APP protocol response events */
    socket.removeAllListeners(this.protocol.Response[0].APP.List);
    socket.removeAllListeners(this.protocol.Response[0].APP.Installing);
    socket.removeAllListeners(this.protocol.Response[0].APP.Installed);
    socket.removeAllListeners(this.protocol.Response[0].APP.InstallCancelled);
    socket.removeAllListeners(this.protocol.Response[0].APP.Uninstalled);
    socket.removeAllListeners(this.protocol.Error[0].APP.Install);
    socket.removeAllListeners(this.protocol.Error[0].APP.Uninstall);

    /* Remove storage protocol response events */
    socket.removeAllListeners(this.protocol.Response[0].Storage.LocalDisks);
    socket.removeAllListeners(this.protocol.Error[0].Storage.GetLocalDisks);
}

/* APP client APIs */
CoreClient.prototype.appGetList = function() {
    this.ioClient.emit(this.protocol.Command[0].APP.List);
}

CoreClient.prototype.appInstall = function(sioStream, appBundle, onDataFn) {
    try {
        this.stream = sioStream.createStream();
        sioStream(this.ioClient).emit(this.protocol.Command[0].APP.Install, this.stream, { name: appBundle.name, size: appBundle.size });

        this.blobStream = sioStream.createBlobReadStream(appBundle);
        this.blobStream.on('data', onDataFn);
        this.blobStream.pipe(this.stream);
    }
    catch (error) {
        alert('APP install error: ' + error.toString());
    }
}

CoreClient.prototype.appUninstall = function(appDirectory) {
    this.ioClient.emit(this.protocol.Command[0].APP.Uninstall, appDirectory);
}

CoreClient.prototype.appCancelInstall = function(appBundle) {
    if (this.blobStream && this.stream) {
        this.blobStream.unpipe();
        this.blobStream.removeAllListeners('data');
        this.ioClient.emit(this.protocol.Command[0].APP.CancelInstall, { name: appBundle.name });
        this.blobStream = undefined;
        this.stream = undefined;
    }
}

/* Storage client APIs */
CoreClient.prototype.storageGetLocalDisks = function() {
    this.ioClient.emit(this.protocol.Command[0].Storage.GetLocalDisks);
}
