function AppManagerClient() {}

extend(AppManagerClient.prototype, Event.prototype);

AppManagerClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.APISpec = _super.apiSpec[0].APP;

    this.filter = function(list) {
        for (var i = list.length - 1; i >= 0; i--) {
            if (!list[i].ShowInLauncher)
                list.splice(i, 1);
        }
        return list;
    };

    /* Dispatch APP APISpec response events */
    this.socket.on(this.APISpec.List.RES, function(apps) {
        var list = self.filter(apps.builtin.concat(apps.user));
        self.event.trigger("app.list", { list: list });
    });

    this.socket.on(this.APISpec.Install.RES, function(installationCode, status) {
        if (status === "Uploading")
            self.event.trigger("app.install#uploading", installationCode);
        else if (status === "Installing")
            self.event.trigger("app.install#installing", installationCode);
        else if (status === "Installed")
            self.event.trigger("app.install#success", installationCode);
    });

    this.socket.on(this.APISpec.Install.ERR, function(error) {
        self.event.trigger("app.install#error", error);
    });

    this.socket.on(this.APISpec.CancelInstall.RES, function(installationCode) {
        self.event.trigger("app.install#cancelled", installationCode);
    });

    this.socket.on(this.APISpec.CancelInstall.ERR, function(error) {
        self.event.trigger("app.install#cancel-error", error);
    });

    this.socket.on(this.APISpec.Uninstall.RES, function(appInfo) {
        self.event.trigger("app.uninstall#success", appInfo);
    });

    this.socket.on(this.APISpec.Uninstall.ERR, function(error) {
        self.event.trigger("app.uninstall#error", error);
    });
}

AppManagerClient.prototype.detach = function() {
    /* Remove APP api response events */
    this.socket.removeAllListeners(this.APISpec.List.RES);
    this.socket.removeAllListeners(this.APISpec.Install.RES);
    this.socket.removeAllListeners(this.APISpec.Install.ERR);
    this.socket.removeAllListeners(this.APISpec.Uninstall.RES);
    this.socket.removeAllListeners(this.APISpec.Uninstall.ERR);
    this.socket.removeAllListeners(this.APISpec.CancelInstall.RES);
    this.socket.removeAllListeners(this.APISpec.CancelInstall.ERR);

    this.socket = undefined;
    this.APISpec = undefined;
}

/* APP client APIs */
AppManagerClient.prototype.list = function() {
    this.socket.emit(this.APISpec.List.REQ);
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
        ss(this.socket).emit(this.APISpec.Install.REQ, this.appBundleDataStream);

        this.blobStream = ss.createBlobReadStream(appBundle);
        this.blobStream.on('data', onDataFn);
        this.blobStream.pipe(this.appBundleDataStream);
    }
    catch (error) {
        alert('APP install error: ' + error);
    }
}

AppManagerClient.prototype.uninstall = function(appInfo) {
    this.socket.emit(this.APISpec.Uninstall.REQ, appInfo);
}

AppManagerClient.prototype.cancelInstall = function(installationCode) {
    if (this.blobStream && this.appBundleDataStream) {
        this.blobStream.unpipe();
        this.blobStream.removeAllListeners('data');
        this.socket.emit(this.APISpec.CancelInstall.REQ, installationCode);
        this.blobStream = undefined;
        this.appBundleDataStream = undefined;
    }
}
