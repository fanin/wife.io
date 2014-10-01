function CoreClient() {
    this.version = 0;
    this.ioClient = undefined;
    this.protocol = undefined;
    this.delegate = undefined;
    this.extension = new Array();
};

CoreClient.prototype.initiate = function() {
    if (this.loadProtoSpec()) {
        this.registerSioListeners(this.ioClient);
        this.registerProtoListeners(this.ioClient);
    }
    else alert('CoreClient error');
}

CoreClient.prototype.loadProtoSpec = function() {
    var self = this;
    var result = false;
    var protoSpec = 'ProtoSpec-v' + self.version;

    $.ajax({
        url: 'http://%SYSIP%:8001/protocol/' + protoSpec + '.json',
        dataType: 'text',
        async: false,
        success: function(data) {
            try {
                self.protocol = $.parseJSON(data).MinorVersion;
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

CoreClient.prototype.registerSioListeners = function(socket) {
    var self = this;

    socket.on('connect', function() {
        self.delegate && self.delegate.connectionEstablished(self);
    });

    socket.on('disconnect', function() {
        /* This event only occurs on server failure */
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

    /* Dispatch Extension protocol response events */
    socket.on(self.protocol[0].Extension.Load.Return.Loaded, function(name, proto) {
        if (proto) {
            self.extension[name].protocol = proto;
            self.extension[name].socket = socket;
            self.extension[name].activate();
            self.delegate && self.delegate.protoResponseExtProtoLoaded(self, name);
        }
    });

    socket.on(self.protocol[0].Extension.Unload.Return.Unloaded, function(name) {
        if (self.extension[name].protocol) {
            self.extension[name].inactivate();
            self.extension[name].protocol = undefined;
            self.delegate && self.delegate.protoResponseExtProtoUnloaded(self, name);
        }
    });

    socket.on(self.protocol[0].Extension.Load.Error, function(name) {
        self.delegate && self.delegate.protoErrorExtProtoLoad(self, name);
    });

    socket.on(self.protocol[0].Extension.Unload.Error, function(name) {
        self.delegate && self.delegate.protoErrorExtProtoUnload(self, name);
    });

    /* Dispatch APP protocol response events */
    socket.on(self.protocol[0].APP.List.Return.List, function(apps) {
        self.delegate && self.delegate.protoResponseAppList(self, apps);
    });

    socket.on(self.protocol[0].APP.Install.Return.Uploading, function(installationCode) {
        self.delegate && self.delegate.protoResponseAppUploading(self, installationCode);
    });

    socket.on(self.protocol[0].APP.Install.Return.Installing, function(installationCode) {
        self.delegate && self.delegate.protoResponseAppInstalling(self, installationCode);
    });

    socket.on(self.protocol[0].APP.Install.Return.Installed, function(installationCode) {
        self.delegate && self.delegate.protoResponseAppInstalled(self, installationCode);
    });

    socket.on(self.protocol[0].APP.CancelInstall.Return.Cancelled, function(installationCode) {
        self.delegate && self.delegate.protoResponseAppInstallCancelled(self, installationCode);
    });

    socket.on(self.protocol[0].APP.Uninstall.Return.Uninstalled, function(appInfo) {
        self.delegate && self.delegate.protoResponseAppUninstalled(self, appInfo);
    });

    socket.on(self.protocol[0].APP.Install.Error, function(error) {
        self.delegate && self.delegate.protoErrorAppInstall(self, error);
    });

    socket.on(self.protocol[0].APP.Uninstall.Error, function(error) {
        self.delegate && self.delegate.protoErrorAppUninstall(self, error);
    });

    /* Dispatch storage protocol response events */
    socket.on(self.protocol[0].Storage.GetLocalDisks.Return.Disks, function(disks) {
        self.delegate && self.delegate.protoResponseLocalDisks(self, disks);
    });

    socket.on(self.protocol[0].Storage.GetLocalDisks.Error, function(error) {
        self.delegate && self.delegate.protoErrorGetLocalDisks(self, error);
    });
}

CoreClient.prototype.unregisterProtoListeners = function(socket) {
    /* Remove Extension protocol response events */
    socket.removeAllListeners(this.protocol[0].Extension.Load.Return.Loaded);
    socket.removeAllListeners(this.protocol[0].Extension.Unload.Return.Unloaded);
    socket.removeAllListeners(this.protocol[0].Extension.Load.Error);
    socket.removeAllListeners(this.protocol[0].Extension.Unload.Error);

    /* Remove APP protocol response events */
    socket.removeAllListeners(this.protocol[0].APP.List.Return.List);
    socket.removeAllListeners(this.protocol[0].APP.Install.Return.Installing);
    socket.removeAllListeners(this.protocol[0].APP.Install.Return.Installed);
    socket.removeAllListeners(this.protocol[0].APP.CancelInstall.Return.Cancelled);
    socket.removeAllListeners(this.protocol[0].APP.Uninstall.Return.Uninstalled);
    socket.removeAllListeners(this.protocol[0].APP.Install.Error);
    socket.removeAllListeners(this.protocol[0].APP.Uninstall.Error);

    /* Remove storage protocol response events */
    socket.removeAllListeners(this.protocol[0].Storage.GetLocalDisks.Return.Disks);
    socket.removeAllListeners(this.protocol[0].Storage.GetLocalDisks.Error);
}

/* Extension client APIs */
CoreClient.prototype.extensionLoad = function(extension) {
    this.extension[extension.name] = extension;
    this.ioClient.emit(this.protocol[0].Extension.Load.Command, extension.name, extension.version);
}

CoreClient.prototype.extensionUnload = function(extension) {
    this.ioClient.emit(this.protocol[0].Extension.Unload.Command, extension.name, extension.version);
}

/* APP client APIs */
CoreClient.prototype.appGetList = function() {
    this.ioClient.emit(this.protocol[0].APP.List.Command);
}

CoreClient.prototype.appInstall = function(sioStream, appBundle, onDataFn) {
    try {
        this.appBundleDataStream = sioStream.createStream();
        sioStream(this.ioClient).emit(this.protocol[0].APP.Install.Command, this.appBundleDataStream);

        this.blobStream = sioStream.createBlobReadStream(appBundle);
        this.blobStream.on('data', onDataFn);
        this.blobStream.pipe(this.appBundleDataStream);
    }
    catch (error) {
        alert('APP install error: ' + error);
    }
}

CoreClient.prototype.appUninstall = function(appInfo) {
    this.ioClient.emit(this.protocol[0].APP.Uninstall.Command, appInfo);
}

CoreClient.prototype.appCancelInstall = function(installationCode) {
    if (this.blobStream && this.appBundleDataStream) {
        this.blobStream.unpipe();
        this.blobStream.removeAllListeners('data');
        this.ioClient.emit(this.protocol[0].APP.CancelInstall.Command, installationCode);
        this.blobStream = undefined;
        this.appBundleDataStream = undefined;
    }
}

/* Storage client APIs */
CoreClient.prototype.storageGetLocalDisks = function() {
    this.ioClient.emit(this.protocol[0].Storage.GetLocalDisks.Command);
}
