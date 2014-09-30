var sio = require('socket.io'),
    ss = require('socket.io-stream'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    randomstring = require('./lib/randomstring'),
    AppManager = require('./app-manager'),
    StorageMonitor = require('./storage-monitor');

var SYSTEM = require('../system');

module.exports = CoreServer;

function CoreServer(http) {
    this.ioServer = sio(http, { 'pingTimeout': 300000 });
    this.extension = new Array();
    this.appManager = new AppManager();
    this.storageMonitor = new StorageMonitor();
    this.error = null;

    this.loadProtoSpec = function(protoSpec) {
        if (!protoSpec)
            protoSpec = 'ProtoSpec-v0';

        var jsonString = fs.readFileSync(path.resolve(__dirname, '../protocol/' + protoSpec + '.json'));
        if (jsonString) {
            try {
                var protocol = JSON.parse(jsonString);
                console.log('Protocol version: ' + protocol.MajorVersion);
                return protocol;
            }
            catch (err) {
                console.log('Protocol error: ' + err);
                this.error = SYSTEM.ERROR.ProtoParse;
                return null;
            }
        }
        else {
            console.log('Protocol not specified');
            this.error = SYSTEM.ERROR.ProtoRead;
            return null;
        }
    }

    this.loadExtProtoSpec = function(extName, version) {
        var protoSpec = extName + '-v' + version + '.json';

        try {
            var jsonString = fs.readFileSync(
                path.resolve(__dirname, '../protocol/ProtoSpecExt-' + protoSpec)
            );

            try {
                var protocol = JSON.parse(jsonString);
                console.log('Extension [' + extName + '] version: ' + protocol.MajorVersion);
                return protocol;
            }
            catch (err) {
                console.log('Extension [' + extName + '] error: ' + err);
                this.error = SYSTEM.ERROR.ProtoParse;
                return null;
            }
        }
        catch (err) {
            console.log('Extension[' + extName + '] ProtoSpec read error: ' + err);
            this.error = SYSTEM.ERROR.ProtoRead;
            return null;
        }
    }

    this.protocol = this.loadProtoSpec();
    if (!this.protocol)
        process.exit(1);
}

CoreServer.prototype.listen = function() {
    var self = this;

    this.ioServer.on('connection', function(socket) {
        self.onSioConnected(socket);

        socket.on('disconnect', function() {
            self.onSioDisconnected(socket);
        });
    });
}

CoreServer.prototype.onSioConnected = function(socket) {
    var self = this;

    //console.log('CoreServer: a client connected to server');

    /**
     * Protocol Listener: Extension Management Events
     */
    socket.on(self.protocol.MinorVersion[0].Extension.Load.Command, function(name, majorVersion) {
        try {
            var ExtensionModule = require('./extension/' + name.toLowerCase() + '/' +  name.toLowerCase());
            self.extension[name] = new ExtensionModule();

            self.extension[name].protocol = self.loadExtProtoSpec(name, majorVersion);
            if (self.extension[name].protocol) {
                self.extension[name].socket = socket;
                self.extension[name].activate();
                socket.emit(self.protocol.MinorVersion[0].Extension.Load.Return.Loaded, name, self.extension[name].protocol);
            }
            else {
                socket.emit(self.protocol.MinorVersion[0].Extension.Load.Error, name, self.error);
            }
        }
        catch (err) {
            console.log('Unable to load extension module [' + name + ']: ' + err);
            socket.emit(self.protocol.MinorVersion[0].Extension.Load.Error, name, SYSTEM.ERROR.ModuleLoad);
        }
    });

    socket.on(self.protocol.MinorVersion[0].Extension.Unload.Command, function(name, majorVersion) {
        if (self.extension[name]) {
            self.extension[name].inactivate();
        }
    });

    /**
     * Protocol Listener: App Management Events
     */
    socket.on(self.protocol.MinorVersion[0].APP.List.Command, function() {
        socket.emit(self.protocol.MinorVersion[0].APP.List.Return.List, self.appManager.listApps());
    });

    ss(socket).on(self.protocol.MinorVersion[0].APP.Install.Command, function(appBundleDataStream) {
        var installationCode = randomstring.generate('XXXXXXXX');
        var filename = SYSTEM.SETTINGS.FileUploadTempPath + '/' + installationCode + '.zip';
        var appWriteStream = fs.createWriteStream(filename);
        self.appBundleDataStream = appBundleDataStream;
        appBundleDataStream.pipe(appWriteStream);

        appBundleDataStream.once('data', function() {
            socket.emit(self.protocol.MinorVersion[0].APP.Install.Return.Uploading, installationCode);
        });

        appBundleDataStream.on('finish', function() {
            socket.emit(self.protocol.MinorVersion[0].APP.Install.Return.Installing, installationCode);

            var result = self.appManager.install(filename).result;
            if (result === 'OK')
                socket.emit(self.protocol.MinorVersion[0].APP.Install.Return.Installed, installationCode);
            else
                socket.emit(self.protocol.MinorVersion[0].APP.Install.Error, result);

            appBundleDataStream.end();
            fs.removeSync(filename);
        });

        appBundleDataStream.on('error', function(err) {
            console.log('APP Install: ' + err);
            socket.emit(self.protocol.MinorVersion[0].APP.Install.Error, SYSTEM.ERROR.FSBrokenPipe);
        });
    });

    socket.on(self.protocol.MinorVersion[0].APP.CancelInstall.Command, function(installationCode) {
        var filename = SYSTEM.SETTINGS.FileUploadTempPath + '/' + installationCode + '.zip';

        if (fs.existsSync(filename))
            fs.removeSync(filename);

        if (self.appBundleDataStream) {
            self.appBundleDataStream.end();
            self.appBundleDataStream.removeAllListeners('finish');
            self.appBundleDataStream.removeAllListeners('error');
            self.appBundleDataStream = undefined;
        }

        socket.emit(self.protocol.MinorVersion[0].APP.CancelInstall.Return.Cancelled, installationCode);
    });

    socket.on(self.protocol.MinorVersion[0].APP.Uninstall.Command, function(appInfo) {
        var result = self.appManager.uninstall(appInfo).result;
        if (result === 'OK')
            socket.emit(self.protocol.MinorVersion[0].APP.Uninstall.Return.Uninstalled, appInfo);
        else
            socket.emit(self.protocol.MinorVersion[0].APP.Uninstall.Error, result);
    });

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(self.protocol.MinorVersion[0].Storage.GetLocalDisks.Command, function() {
        self.storageMonitor.retrieveLocalDisks(function() {
            if (!self.storageMonitor.systemDisk) {
                socket.emit(self.protocol.MinorVersion[0].Storage.GetLocalDisks.Error, SYSTEM.ERROR.StorSystemDiskNotFound);
            }

            if (!self.storageMonitor.userDisk) {
                socket.emit(self.protocol.MinorVersion[0].Storage.GetLocalDisks.Error, SYSTEM.ERROR.StorUserDiskNotFound);
            }

            socket.emit(self.protocol.MinorVersion[0].Storage.GetLocalDisks.Return.Disks, {
                system: self.storageMonitor.systemDisk,
                user: self.storageMonitor.userDisk,
                removable: self.storageMonitor.removableDisk
            });
        });
    });
}

CoreServer.prototype.onSioDisconnected = function(socket) {
    //console.log('CoreServer: disconnected from client');
    socket.removeAllListeners(this.protocol.MinorVersion[0].Extension.Load.Command);
    socket.removeAllListeners(this.protocol.MinorVersion[0].Extension.Unload.Command);
    socket.removeAllListeners(this.protocol.MinorVersion[0].APP.List.Command);
    socket.removeAllListeners(this.protocol.MinorVersion[0].APP.Install.Command);
    socket.removeAllListeners(this.protocol.MinorVersion[0].APP.CancelInstall.Command);
    socket.removeAllListeners(this.protocol.MinorVersion[0].APP.Uninstall.Command);
    socket.removeAllListeners(this.protocol.MinorVersion[0].Storage.GetLocalDisks.Command);
    socket.removeAllListeners('disconnect');
}
