var sio = require('socket.io'),
    ss = require('socket.io-stream'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    AppManager = require('./app-manager'),
    StorageMonitor = require('./storage-monitor');

var SYSTEM = require('../system');

module.exports = CoreServer;

function CoreServer(http) {
    this.ioServer = sio(http, { 'pingTimeout': 300000 });
    this.extension = new Array();
    this.appManager = new AppManager();
    this.storageMonitor = new StorageMonitor();

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
                console.log('Protocol error: ' + err.toString());
                return null;
            }
        }
        else {
            console.log('Protocol not specified');
            return null;
        }
    }

    this.loadExtProtoSpec = function(extName, version) {
        if (!extName)
            return null;

        try {
            var jsonString = fs.readFileSync(
                path.resolve(__dirname, '../protocol/ProtoSpecExt-' + extName + '-v' + version + '.json')
            );

            try {
                var protocol = JSON.parse(jsonString);
                console.log('Extension [' + extName + '] version: ' + protocol.MajorVersion);
                return protocol;
            }
            catch (err) {
                console.log('Extension [' + extName + '] error: ' + err.toString());
                return null;
            }
        }
        catch (err) {
            console.log('Extension[' + extName + '] ProtoSpec read error: ' + err.toString());
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
    socket.on(self.protocol.Command[0].Extension.Load, function(extName, version) {
        try {
            var ExtensionModule = require('./extension/' + extName.toLowerCase() + '/' +  extName.toLowerCase());
            self.extension[extName] = new ExtensionModule();

            self.extension[extName].protocol = self.loadExtProtoSpec(extName, version);
            if (self.extension[extName].protocol) {
                self.extension[extName].socket = socket;
                self.extension[extName].activate();
                socket.emit(self.protocol.Response[0].Extension.Loaded, extName, self.extension[extName].protocol);
            }
            else {
                socket.emit(self.protocol.Error[0].Extension.Load, extName);
            }
        }
        catch (err) {
            console.log('Unable to load extension module [' + extName + ']: ' + err);
            socket.emit(self.protocol.Error[0].Extension.Load, extName);
        }
    });

    socket.on(self.protocol.Command[0].Extension.Unload, function(extName, version) {
        if (self.extension[extName]) {
            self.extension[extName].inactivate();
        }
    });

    /**
     * Protocol Listener: App Management Events
     */
    socket.on(self.protocol.Command[0].APP.List, function() {
        socket.emit(self.protocol.Response[0].APP.List, self.appManager.listApps());
    });

    ss(socket).on(self.protocol.Command[0].APP.Install, function(stream, appBundle) {
        var filename = SYSTEM.SETTINGS.FileUploadTempPath + '/' + appBundle.name;
        var appWriteStream = fs.createWriteStream(filename);
        self.stream = stream;
        stream.pipe(appWriteStream);

        stream.on('finish', function() {
            socket.emit(self.protocol.Response[0].APP.Installing, appBundle);

            var result = self.appManager.install(filename).result;
            if (result === 'OK')
                socket.emit(self.protocol.Response[0].APP.Installed, appBundle);
            else
                socket.emit(self.protocol.Error[0].APP.Install, result);

            stream.end();
            fs.removeSync(filename);
        });

        stream.on('error', function(err) {
            console.log('APP Install: ' + err);
            socket.emit(self.protocol.Error[0].APP.Install, 'ERROR-BROKEN-PIPE');
        });
    });

    socket.on(self.protocol.Command[0].APP.CancelInstall, function(appBundle) {
        var filename = SYSTEM.SETTINGS.FileUploadTempPath + '/' + appBundle.name;
        if (fs.existsSync(filename))
            fs.removeSync(filename);

        if (self.stream) {
            self.stream.end();
            self.stream.removeAllListeners('finish');
            self.stream.removeAllListeners('error');
            self.stream = undefined;
        }

        socket.emit(self.protocol.Response[0].APP.InstallCancelled, appBundle);
    });

    socket.on(self.protocol.Command[0].APP.Uninstall, function(appDirectory) {
        var result = self.appManager.uninstall(appDirectory).result;
        if (result === 'OK')
            socket.emit(self.protocol.Response[0].APP.Uninstalled, appDirectory);
        else
            socket.emit(self.protocol.Error[0].APP.Uninstall, result);
    });

    /**
     * Protocol Listener: Storage Events
     */
    socket.on(self.protocol.Command[0].Storage.GetLocalDisks, function() {
        self.storageMonitor.retrieveLocalDisks(function() {
            if (!self.storageMonitor.systemDisk) {
                socket.emit(self.protocol.Error[0].Storage.GetLocalDisks, 'ERROR-SYSTEM-DISK');
            }

            if (!self.storageMonitor.userDisk) {
                socket.emit(self.protocol.Error[0].Storage.GetLocalDisks, 'ERROR-USER-DISK');
            }

            socket.emit(self.protocol.Response[0].Storage.LocalDisks, {
                system: self.storageMonitor.systemDisk,
                user: self.storageMonitor.userDisk,
                removable: self.storageMonitor.removableDisk
            });
        });
    });
}

CoreServer.prototype.onSioDisconnected = function(socket) {
    //console.log('CoreServer: disconnected from client');
    socket.removeAllListeners(this.protocol.Command[0].Extension.Load);
    socket.removeAllListeners(this.protocol.Command[0].Extension.Unload);
    socket.removeAllListeners(this.protocol.Command[0].APP.List);
    socket.removeAllListeners(this.protocol.Command[0].APP.Install);
    socket.removeAllListeners(this.protocol.Command[0].APP.CancelInstall);
    socket.removeAllListeners(this.protocol.Command[0].APP.Uninstall);
    socket.removeAllListeners(this.protocol.Command[0].Storage.GetLocalDisks);
    socket.removeAllListeners('disconnect');
}
