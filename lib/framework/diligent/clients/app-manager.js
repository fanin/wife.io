var EventEmitter = require('events').EventEmitter;
var ss           = require('socket.io-stream');
var assign       = require('object-assign');
var StringCode   = require('utils/string-code');
var TaskQueue    = require('utils/task-queue');
var cbq          = require('./callback-queue');

var AppManager = assign({}, EventEmitter.prototype, {
    /**
     * Attach APP API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        this.socket = _super.ioClient;
        this.wsapi = _super.wsapi[0].APP;
        this.taskQueue = new TaskQueue(this._installTaskHandler);

        function removeHiddenApps(list) {
            for (var i = list.length - 1; i >= 0; i--) {
                if (!list[i].show_in_launcher)
                    list.splice(i, 1);
            }
            return list;
        }

        /* Dispatch APP wsapi response events */
        this.socket.on(this.wsapi.List.RES, function(apps) {
            var list = removeHiddenApps(apps.builtin.concat(apps.user));
            cbq.dequeueApiCallback('app.list', 'default', function(apiCallback) {
                apiCallback(list);
                return true;
            });
        }.bind(this));

        this.socket.on(this.wsapi.Install.RES, function(status, instid) {
            var task = this.taskQueue.getCurrentTask();
            if (!task) return;

            switch (status) {
                case "Initiating":
                    break;
                case "Uploading":
                    //this.emit("appmanager.install.uploading", { instid: instid });
                    break;
                case "Installing": // TODO: Add installing arg to callback
                    //this.emit("appmanager.install.installing", { instid: instid });
                    cbq.dequeueApiCallback('app.installing', instid, function(apiCallback) {
                        apiCallback(instid);
                        return true;
                    });
                    break;
                case "Installed":
                    //this.emit("appmanager.install.success", { instid: instid });
                    cbq.dequeueApiCallback('app.installed', instid, function(apiCallback) {
                        apiCallback(instid);
                        return true;
                    });
                    task.context.appReadStream.removeAllListeners('data');
                    this.taskQueue.finishTask(task);
                    break;
            }
        }.bind(this));

        this.socket.on(this.wsapi.Install.ERR, function(instid, error) {
            var task = this.taskQueue.getCurrentTask();
            if (!task) return;

            task.context.appReadStream.removeAllListeners('data');
            this.taskQueue.finishTask(task);

            //this.emit("appmanager.install.error", { instid: instid, error: error });
            cbq.dequeueApiCallback('app.installed', instid, function(apiCallback) {
                apiCallback(instid, error);
                return true;
            });
        }.bind(this));

        this.socket.on(this.wsapi.CancelInstall.RES, function(instid) {
            //this.emit("appmanager.install.cancel.success", { instid: instid });
            cbq.dequeueApiCallback('app.cancelInstall', instid, function(apiCallback) {
                apiCallback(instid);
                return true;
            });
        }.bind(this));

        this.socket.on(this.wsapi.CancelInstall.ERR, function(instid, error) {
            //this.emit("appmanager.install.cancel.error", { instid: instid, error: error });
            cbq.dequeueApiCallback('app.cancelInstall', instid, function(apiCallback) {
                apiCallback(instid, error);
                return true;
            });
        }.bind(this));

        this.socket.on(this.wsapi.Uninstall.RES, function(manifest) {
            //this.emit("appmanager.uninstall.success", { manifest: manifest });
            cbq.dequeueApiCallback('app.uninstall', manifest.identifier, function(apiCallback) {
                apiCallback(manifest);
                return true;
            });
        }.bind(this));

        this.socket.on(this.wsapi.Uninstall.ERR, function(error) {
            //this.emit("appmanager.uninstall.error", { error: error });
            cbq.dequeueApiCallback('app.uninstall', manifest.identifier, function(apiCallback) {
                apiCallback(manifest, error);
                return true;
            });
        }.bind(this));
    },

    /**
     * Detach APP API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.wsapi.List.RES);
        this.socket.removeAllListeners(this.wsapi.Install.RES);
        this.socket.removeAllListeners(this.wsapi.Install.ERR);
        this.socket.removeAllListeners(this.wsapi.Uninstall.RES);
        this.socket.removeAllListeners(this.wsapi.Uninstall.ERR);
        this.socket.removeAllListeners(this.wsapi.CancelInstall.RES);
        this.socket.removeAllListeners(this.wsapi.CancelInstall.ERR);

        this.socket = undefined;
        this.wsapi = undefined;

        delete this.taskQueue;
    },

    /**
     * Get the APP list
     */
    list: function(onComplete) {
        cbq.queueApiCallback('app.list', 'default', onComplete);
        this.socket.emit(this.wsapi.List.REQ);
    },

    /**
     * Get the APP type
     * @param {object} APP info object
     * @return {string} builtin | user | unknown
     */
    getType: function(manifest) {
        if (manifest) {
            if (manifest.identifier.indexOf('BAPP') === 0)
                return 'builtin';
            else if (manifest.identifier.indexOf('UAPP') === 0)
                return 'user';
        }
        return 'unknown';
    },

    /**
     * Install APP bundle
     * @param {object} File object from a FileList object on a file type input object
     * @param {function} callback of installation progress
     */
    install: function(appBundleFile, onUploadProgress, onInstalling, onComplete) {
        var instid = StringCode.generateUID();

        cbq.queueApiCallback('app.installing', instid, onInstalling);
        cbq.queueApiCallback('app.installed', instid, onComplete);

        this.taskQueue.addTask({
            socket: this.socket,
            instApi: this.wsapi.Install,
            instid: instid,
            instFile: appBundleFile,
            status: 'Waiting',
            dataStream: ss.createStream(),
            appReadStream: ss.createBlobReadStream(appBundleFile),
            progressHandler: onUploadProgress
        });

        return instid;
    },

    _installTaskHandler: function(task) {
        var size = 0;
        ss(task.context.socket).emit(task.context.instApi.REQ, task.context.instid, task.context.dataStream);
        task.context.appReadStream.on('data', function(chunk) {
            size += chunk.length;
            task.context.progressHandler &&
                task.context.progressHandler(task.context.instid, Math.floor(size / task.context.instFile.size * 100));
        });
        task.context.appReadStream.pipe(task.context.dataStream);
    },

    /**
     * Uninstall APP
     * @param {object} APP info object
     */
    uninstall: function(manifest, onComplete) {
        cbq.queueApiCallback('app.uninstall', manifest.identifier, onComplete);
        this.socket.emit(this.wsapi.Uninstall.REQ, manifest);
    },

    /**
     * Cancel installation
     * @param {object} installation code
     * @return {boolean} true if installation is cancelled immediately; false otherwise, should wait for server response.
     */
    cancelInstall: function(instid, onComplete) {
        var task = this.taskQueue.searchTask(function(_task) {
            if (_task.context.instid === instid)
                return true;
            return false;
        });

        if (task) {
            var isTaskRunning = (task.status === 'RUNNING');

            if (task.context.appReadStream) {
                this.taskQueue.finishTask(task);
                cbq.queueApiCallback('app.cancelInstall', instid, onComplete);
                task.context.appReadStream.removeAllListeners('data');
                task.context.appReadStream.unpipe();
                this.socket.emit(this.wsapi.CancelInstall.REQ, instid);
            }

            if (isTaskRunning)
                return false;
        }

        onComplete(instid);
        return true;
    }
});

module.exports = AppManager;
