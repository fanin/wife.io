function CoreClient() {
    this.version = 0;
    this.ioClient = undefined;
    this.protocol = undefined;
    this.delegate = this;
    this.extension = new Array();
};

extend(CoreClient.prototype, ConnectionDelegate);
extend(CoreClient.prototype, ProtocolDelegate);
extend(CoreClient.prototype, ExtensionDelegate);

CoreClient.prototype.initiate = function() {
    var self = this;

    function loadProtoSpec() {
        var result = false;
        var protoSpec = 'ProtoSpec-v' + self.version;

        $.ajax({
            url: 'http://%SYSIP%:8001/protocol/' + protoSpec + '.json',
            dataType: 'text',
            async: false,
            success: function(data) {
                try {
                    self.protocol = $.parseJSON(data).MinorVersion;
                    self.delegate.protocolDidLoad();

                    /* Using 'forceNew' attribute to fix connect->disconnect->connect fail problem */
                    self.ioClient = io('http://%SYSIP%:8001', { 'forceNew': true, 'pingTimeout': 300000 });

                    result = true;
                }
                catch (error) {
                    self.delegate.protocolDidFailLoadWithError(error);
                }
            }
        });

        return result;
    }

    function registerSioListeners(socket) {
        socket.on('connect', function() {
            self.delegate.connectionDidEstablish();
        });

        socket.on('disconnect', function() {
            /* This event only occurs on server failure */
            unregisterProtoListeners(socket);
            unregisterSioListeners(socket);
            self.delegate.connectionDidClose();
        });

        socket.on('connect_error', function(error) {
            self.delegate.connectionDidFailWithError(error);
        });
    }

    function unregisterSioListeners(socket) {
        socket.removeAllListeners('connect');
        socket.removeAllListeners('disconnect');
        socket.removeAllListeners('connect_error');
    }

    function registerProtoListeners(socket) {
        /* Dispatch Extension protocol response events */
        socket.on(self.protocol[0].Extension.Load.Return.Loaded, function(name, proto) {
            if (proto) {
                self.extension[name].protocol = proto;
                self.extension[name].socket = socket;
                self.extension[name].activate();
                self.delegate.extensionDidLoad(name);
            }
        });

        socket.on(self.protocol[0].Extension.Unload.Return.Unloaded, function(name) {
            if (self.extension[name].protocol) {
                self.extension[name].inactivate();
                self.extension[name].protocol = undefined;
                self.delegate.extensionDidUnload(name);
            }
        });

        socket.on(self.protocol[0].Extension.Load.Error, function(name) {
            self.delegate.extensionDidFailLoadWithError(name);
        });

        socket.on(self.protocol[0].Extension.Unload.Error, function(name) {
            self.delegate.extensionDidFailUnloadWithError(name);
        });

        /* Dispatch APP protocol response events */
        socket.on(self.protocol[0].APP.List.Return.List, function(apps) {
            self.delegate.list(apps);
        });

        socket.on(self.protocol[0].APP.Install.Return.Uploading, function(installationCode) {
            self.delegate.appIsUploading(installationCode);
        });

        socket.on(self.protocol[0].APP.Install.Return.Installing, function(installationCode) {
            self.delegate.appIsInstalling(installationCode);
        });

        socket.on(self.protocol[0].APP.Install.Return.Installed, function(installationCode) {
            self.delegate.appDidInstall(installationCode);
        });

        socket.on(self.protocol[0].APP.CancelInstall.Return.Cancelled, function(installationCode) {
            self.delegate.appDidCancelInstall(installationCode);
        });

        socket.on(self.protocol[0].APP.Uninstall.Return.Uninstalled, function(appInfo) {
            self.delegate.appDidUninstall(appInfo);
        });

        socket.on(self.protocol[0].APP.Install.Error, function(error) {
            self.delegate.appDidFailInstallWithError(error);
        });

        socket.on(self.protocol[0].APP.Uninstall.Error, function(error) {
            self.delegate.appDidFailUninstallWithError(error);
        });

        /* Dispatch storage protocol response events */
        socket.on(self.protocol[0].Storage.GetLocalDisks.Return.Disks, function(disks) {
            self.delegate.localDisks(disks);
        });

        socket.on(self.protocol[0].Storage.GetLocalDisks.Error, function(error) {
            self.delegate.storageDidFailGetLocalDisksWithError(error);
        });
    }

    function unregisterProtoListeners(socket) {
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

    if (loadProtoSpec()) {
        registerSioListeners(this.ioClient);
        registerProtoListeners(this.ioClient);
    }
    else alert('CoreClient load proto specification error');
}


/* Implement default connection delegates */
CoreClient.prototype.connectionDidEstablish = function() {
    //alert("Socket.IO connection established");
};

CoreClient.prototype.connectionDidClose = function() {
    //alert("Socket.IO connection closed");
};

CoreClient.prototype.connectionDidFailWithError = function(error) {
    //alert("Socket.IO connection error: " + error);
};

/* Implement default protocol delegates */
CoreClient.prototype.protocolDidLoad = function() {
    //alert("Protocol version " + this.version + " loaded");
};

CoreClient.prototype.protocolDidFailLoadWithError = function(error) {
    //alert("Protocol version " + this.version + " load error: " + error);
};

/* Implement extension protocol delegates */
CoreClient.prototype.extensionDidLoad = function(name) {
    //alert("Extension protocol [" + name + "] loaded");
};

CoreClient.prototype.extensionDidUnload = function(name) {
    //alert("Extension protocol [" + name + "] unloaded");
};

CoreClient.prototype.extensionDidFailLoadWithError = function(name) {
    //alert("Extension protocol [" + name + "] load failed");
};

CoreClient.prototype.extensionDidFailUnloadWithError = function(name) {
    //alert("Extension protocol [" + name + "] unload failed");
};


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
