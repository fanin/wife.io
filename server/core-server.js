var sio = require('socket.io'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    randomstring = require('./lib/randomstring'),
    ExtensionManager = require('./extension-manager'),
    SecurityManager = require('./security-manager'),
    AppManager = require('./app-manager'),
    FileManager = require('./file-manager'),
    StorageMonitor = require('./storage-monitor');

var SYSTEM = require('../system');

module.exports = CoreServer;

function CoreServer(http) {
    this.ioServer = sio(http, { 'pingTimeout': 300000 });
    this.extensionManager = new ExtensionManager();
    this.appManager = new AppManager();
    this.storageMonitor = new StorageMonitor();
    this.fileManager = new FileManager();
    this.securityManager = [];
    this.error = null;

    this.loadProtoSpec = function(name, version) {
        var self = this;
        var protoSpec = name + '-v' + version;

        var jsonString = fs.readFileSync(path.resolve(__dirname, '../protocol/' + protoSpec + '.json'));
        if (jsonString) {
            try {
                var p = JSON.parse(jsonString);
                console.log('Protocol [' + protoSpec + '] version: ' + p.MajorVersion);
                return p.MinorVersion;
            }
            catch (err) {
                //console.log('Protocol error: ' + err);
                self.error = SYSTEM.ERROR.ProtoParse;
                return null;
            }
        }
        else {
            //console.log('Protocol not specified');
            self.error = SYSTEM.ERROR.ProtoRead;
            return null;
        }
    }

    this.protocol = this.loadProtoSpec('ProtoSpec', 0);
    if (!this.protocol) {
        console.log('Unable to load protocol specification, error = ' + this.error);
        process.exit(1);
    }
}

CoreServer.prototype.listen = function() {
    var self = this;

    this.ioServer.on('connection', function(socket) {
        /* Handle protocol handshaking */
        socket.on(self.protocol[0].Base.GetInfo.REQ, function(appDirectory) {
            var appInfo = self.appManager.getAppInfo(appDirectory);

            if (!SYSTEM.ERROR.HasError(appInfo)) {
                /* Response AppInfo to app client */
                socket.emit(self.protocol[0].Base.GetInfo.RES, appInfo);

                /* Create security manager for this app */
                self.securityManager[socket] = new SecurityManager(appInfo);

                /* Register protocols for this app */
                self.extensionManager.register(self, socket, self.protocol[0].Extension);
                self.appManager.register(self, socket, self.protocol[0].APP);
                self.storageMonitor.register(self, socket, self.protocol[0].Storage);
                self.fileManager.register(self, socket, self.protocol[0].FileSystem);
            }
            else
                socket.emit(self.protocol[0].Base.GetInfo.ERR, appInfo);
        });

        socket.on('disconnect', function() {
            /* Unregister protocols for this app */
            self.extensionManager.unregister(socket, self.protocol[0].Extension);
            self.appManager.unregister(socket, self.protocol[0].APP);
            self.storageMonitor.unregister(socket, self.protocol[0].Storage);
            self.fileManager.unregister(socket, self.protocol[0].FileSystem);

            socket.removeAllListeners(self.protocol[0].Base.GetInfo.REQ);
            socket.removeAllListeners('disconnect');

            self.securityManager[socket] = undefined;
        });
    });
}
