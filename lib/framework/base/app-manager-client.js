var EventEmitter = require('events').EventEmitter;
var ss = require('socket.io-stream');
var assign = require('object-assign');

var AppManagerClient = assign({}, EventEmitter.prototype, {
    /**
     * Attach APP API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        this.socket = _super.ioClient;
        this.APISpec = _super.apiSpec[0].APP;

        function removeHiddenApps(list) {
            for (var i = list.length - 1; i >= 0; i--) {
                if (!list[i].ShowInLauncher)
                    list.splice(i, 1);
            }
            return list;
        }

        /* Dispatch APP APISpec response events */
        this.socket.on(this.APISpec.List.RES, function(apps) {
            var list = removeHiddenApps(apps.builtin.concat(apps.user));
            this.emit("app.list", { list: list });
        }).bind(this);

        this.socket.on(this.APISpec.Install.RES, function(installationCode, status) {
            if (status === "Uploading")
                this.emit("app.install#uploading", installationCode);
            else if (status === "Installing")
                this.emit("app.install#installing", installationCode);
            else if (status === "Installed")
                this.emit("app.install#success", installationCode);
        }).bind(this);

        this.socket.on(this.APISpec.Install.ERR, function(error) {
            this.emit("app.install#error", error);
        }).bind(this);

        this.socket.on(this.APISpec.CancelInstall.RES, function(installationCode) {
            this.emit("app.install#cancelled", installationCode);
        }).bind(this);

        this.socket.on(this.APISpec.CancelInstall.ERR, function(error) {
            this.emit("app.install#cancel-error", error);
        }).bind(this);

        this.socket.on(this.APISpec.Uninstall.RES, function(appInfo) {
            this.emit("app.uninstall#success", appInfo);
        }).bind(this);

        this.socket.on(this.APISpec.Uninstall.ERR, function(error) {
            this.emit("app.uninstall#error", error);
        }).bind(this);
    },

    /**
     * Detach APP API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.APISpec.List.RES);
        this.socket.removeAllListeners(this.APISpec.Install.RES);
        this.socket.removeAllListeners(this.APISpec.Install.ERR);
        this.socket.removeAllListeners(this.APISpec.Uninstall.RES);
        this.socket.removeAllListeners(this.APISpec.Uninstall.ERR);
        this.socket.removeAllListeners(this.APISpec.CancelInstall.RES);
        this.socket.removeAllListeners(this.APISpec.CancelInstall.ERR);

        this.socket = undefined;
        this.APISpec = undefined;
    },

    /**
     * Get the APP list
     */
    list: function() {
        this.socket.emit(this.APISpec.List.REQ);
    },

    /**
     * Get the APP type
     * @param {object} APP info object
     * @return {string} builtin | user | unknown
     */
    getType: function(appInfo) {
        if (appInfo) {
            if (appInfo.AppIdentifier.indexOf('BAPP') === 0)
                return 'builtin';
            else if (appInfo.AppIdentifier.indexOf('UAPP') === 0)
                return 'user';
        }
        return 'unknown';
    },

    /**
     * Install APP bundle
     * @param {object} File object from a FileList object on a file type input object
     * @param {function} callback of installation progress
     */
    install: function(appBundle, onDataFn) {
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
    },

    /**
     * Uninstall APP
     * @param {object} APP info object
     */
    uninstall: function(appInfo) {
        this.socket.emit(this.APISpec.Uninstall.REQ, appInfo);
    },

    /**
     * Cancel installation
     * @param {object} installation code
     */
    cancelInstall: function(installationCode) {
        if (this.blobStream && this.appBundleDataStream) {
            this.blobStream.unpipe();
            this.blobStream.removeAllListeners('data');
            this.socket.emit(this.APISpec.CancelInstall.REQ, installationCode);
            this.blobStream = undefined;
            this.appBundleDataStream = undefined;
        }
    }
});

module.exports = AppManagerClient;
