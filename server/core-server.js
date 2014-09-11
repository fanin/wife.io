var sio = require('socket.io'),
    ss = require('socket.io-stream'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    AppManager = require('./app-manager'),
    StorageMonitor = require('./storage-monitor');

module.exports = CoreServer;

function CoreServer(http) {
    this.protocol = undefined;
    this.ioServer = sio(http, { 'pingTimeout': 300000 });
    this.appManager = new AppManager();
    this.storageMonitor = new StorageMonitor();
    this.loadProtoSpec();
}

CoreServer.prototype.loadProtoSpec = function(protoSpec) {
    if (!protoSpec)
        protoSpec = 'ProtoSpec-v0';

    var jsonString = fs.readFileSync(path.resolve(__dirname, '../protocol/' + protoSpec + '.json'));
    if (jsonString) {
        try {
            this.protocol = JSON.parse(jsonString);
            console.log('Protocol version: ' + this.protocol.MajorVersion);
        }
        catch (err) {
            console.log('Protocol error: ' + err.toString());
            process.exit(1);
        }
    }
    else {
        console.log('Protocol not specified');
        process.exit(1);
    }
}

CoreServer.prototype.loadExtProtoSpec = function(protoSpec) {
    if (!protoSpec)
        return false;

    var jsonString = fs.readFileSync(path.resolve(__dirname, '../protocol/' + protoSpec + '.json'));
    if (jsonString) {
        try {
            this.protocol.extension = JSON.parse(jsonString);
            console.log('Extension Protocol version: ' + this.protocol.extension.MajorVersion);
        }
        catch (err) {
            console.log('Extension Protocol error: ' + err.toString());
            return false;
        }
    }
    else {
        console.log('Protocol not specified');
        return false;
    }

    return true;
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
     * Socket.IO Protocol: App Management Events
     */
    socket.on(self.protocol.Command[0].APP.List, function() {
        socket.emit(self.protocol.Response[0].APP.List, self.appManager.listApps());
    });

    ss(socket).on(self.protocol.Command[0].APP.Install, function(stream, appBundle) {
        var filename = '/tmp/' + appBundle.name;
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
        var filename = '/tmp/' + appBundle.name;
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
        if (result == 'OK')
            socket.emit(self.protocol.Response[0].APP.Uninstalled, appDirectory);
        else
            socket.emit(self.protocol.Error[0].APP.Uninstall, result);
    });

    /**
     * Socket.IO Protocol: Storage Events
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
    socket.removeAllListeners(this.protocol.Command[0].APP.List);
    socket.removeAllListeners(this.protocol.Command[0].APP.Install);
    socket.removeAllListeners(this.protocol.Command[0].APP.CancelInstall);
    socket.removeAllListeners(this.protocol.Command[0].APP.Uninstall);
    socket.removeAllListeners(this.protocol.Command[0].Storage.GetLocalDisks);
    socket.removeAllListeners('disconnect');
}
