function AppManagerClient() {}

AppManagerClient.prototype.register = function(_super) {
    var self = this;

    this.delegate = _super;
    this.socket = _super.ioClient;
    this.protoAPP = _super.protocol[0].APP;

    this.filter = function(list) {
        for (var i = list.length - 1; i >= 0; i--) {
            if (!list[i].ShowInLauncher)
                list.splice(i, 1);
        }
        return list;
    };

    /* Dispatch APP protocol response events */
    this.socket.on(this.protoAPP.List.RES, function(apps) {
        self.delegate.appListDidLoad(self.filter(apps.builtin.concat(apps.user)));
    });

    this.socket.on(this.protoAPP.Install.RES, function(installationCode, status) {
        if (status === "Uploading")
            self.delegate.appIsUploading(installationCode);
        else if (status === "Installing")
            self.delegate.appIsInstalling(installationCode);
        else if (status === "Installed")
            self.delegate.appDidInstall(installationCode);
    });

    this.socket.on(this.protoAPP.Install.ERR, function(error) {
        self.delegate.appDidFailInstallWithError(error);
    });

    this.socket.on(this.protoAPP.CancelInstall.RES, function(installationCode) {
        self.delegate.appDidCancelInstall(installationCode);
    });

    this.socket.on(this.protoAPP.CancelInstall.ERR, function(error) {
        self.delegate.appDidFailCancelInstallWithError(error);
    });

    this.socket.on(this.protoAPP.Uninstall.RES, function(appInfo) {
        self.delegate.appDidUninstall(appInfo);
    });

    this.socket.on(this.protoAPP.Uninstall.ERR, function(error) {
        self.delegate.appDidFailUninstallWithError(error);
    });
}

AppManagerClient.prototype.unregister = function() {
    /* Remove APP protocol response events */
    this.socket.removeAllListeners(this.protoAPP.List.RES);
    this.socket.removeAllListeners(this.protoAPP.Install.RES);
    this.socket.removeAllListeners(this.protoAPP.Install.ERR);
    this.socket.removeAllListeners(this.protoAPP.Uninstall.RES);
    this.socket.removeAllListeners(this.protoAPP.Uninstall.ERR);
    this.socket.removeAllListeners(this.protoAPP.CancelInstall.RES);
    this.socket.removeAllListeners(this.protoAPP.CancelInstall.ERR);

    this.delegate = undefined;
    this.socket = undefined;
    this.protoAPP = undefined;
}

/* APP client APIs */
AppManagerClient.prototype.list = function() {
    this.socket.emit(this.protoAPP.List.REQ);
}

AppManagerClient.prototype.getType = function(appInfo) {
    if (appInfo) {
        if (appInfo.AppIdentifier.indexOf('BAPP') === 0)
            return 'builtin';
        else if (appInfo.AppIdentifier.indexOf('UAPP') === 0)
            return 'user';
    }
    return 'unknown';
}

AppManagerClient.prototype.install = function(appBundle, onDataFn) {
    try {
        this.appBundleDataStream = ss.createStream();
        ss(this.socket).emit(this.protoAPP.Install.REQ, this.appBundleDataStream);

        this.blobStream = ss.createBlobReadStream(appBundle);
        this.blobStream.on('data', onDataFn);
        this.blobStream.pipe(this.appBundleDataStream);
    }
    catch (error) {
        alert('APP install error: ' + error);
    }
}

AppManagerClient.prototype.uninstall = function(appInfo) {
    this.socket.emit(this.protoAPP.Uninstall.REQ, appInfo);
}

AppManagerClient.prototype.cancelInstall = function(installationCode) {
    if (this.blobStream && this.appBundleDataStream) {
        this.blobStream.unpipe();
        this.blobStream.removeAllListeners('data');
        this.socket.emit(this.protoAPP.CancelInstall.REQ, installationCode);
        this.blobStream = undefined;
        this.appBundleDataStream = undefined;
    }
}
