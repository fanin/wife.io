/*
 * TODO:
 * 1) Introduce express to handle APP routing
 */

var sio = require('socket.io'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    ip = require('ip'),
    mime = require('mime'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    randomstring = require('./lib/randomstring'),
    ExtensionManager = require('./extension-manager'),
    SecurityManager = require('./security-manager'),
    NotificationCenter = require('./notification-center'),
    AppManager = require('./app-manager'),
    FileManager = require('./file-manager'),
    StorageManager = require('./storage-manager');

var SYSTEM = require('../system');

module.exports = CoreServer;

function CoreServer(http) {
    this.ioServer = sio(http, { 'pingTimeout': 300000 });
    this.emitter = new EventEmitter();
    this.extensionManager = new ExtensionManager();
    this.notificationCenter = new NotificationCenter();
    this.appManager = new AppManager();
    this.storageManager = new StorageManager();
    this.fileManager = new FileManager();
    this.securityManager = new SecurityManager();
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
                async.series([
                    function(callback) {
                        /* Create security manager for this app (connection) */
                        self.securityManager.register(self, socket, appInfo, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register extension manager */
                        self.extensionManager.register(self, socket, self.protocol[0].Extension, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register notification center */
                        self.notificationCenter.register(self, socket, self.protocol[0].Notification, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register storage manager (must be done before registering app manager & file manager */
                        self.storageManager.register(self, socket, self.protocol[0].Storage, function(error) {
                            callback(error, true);
                        });
                    },
                    function(callback) {
                        /* Register app manager */
                        self.appManager.register(self, socket, self.protocol[0].APP, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register file manager */
                        self.fileManager.register(self, socket, self.protocol[0].FileSystem, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        socket.on('disconnect', function() {
                            /* Unregister protocols for this app */
                            self.fileManager.unregister(socket, self.protocol[0].FileSystem);
                            self.appManager.unregister(socket, self.protocol[0].APP);
                            self.notificationCenter.unregister(socket, self.protocol[0].Notification);
                            self.extensionManager.unregister(socket, self.protocol[0].Extension);
                            self.storageManager.unregister(socket, self.protocol[0].Storage);
                            self.securityManager.unregister(socket);

                            socket.removeAllListeners(self.protocol[0].Base.GetInfo.REQ);
                            socket.removeAllListeners('disconnect');
                        });

                        callback(null, true);
                    }
                ],
                function(err, results) {
                    /* Response AppInfo to app client */
                    socket.emit(self.protocol[0].Base.GetInfo.RES, appInfo);
                });
            }
            else
                socket.emit(self.protocol[0].Base.GetInfo.ERR, appInfo);
        });
    });
}

CoreServer.prototype.handleRequest = function(req, res) {
    var self = this;
    var url = require('url').parse(req.url, true);
    var filename = url.pathname;
    var query = url.query;
    var rootdir = path.dirname(__dirname);
    var filepath = path.join(rootdir, filename);

    function backToLauncher() {
        // Redirect to launcher
        res.writeHead(301, {
            "location" : 'http://' + req.headers.host + '/apps/b/launcher/'
        });
        res.end();
    }

    /* Route allowed URL to real path */
    var urlComponent = filename.split(path.sep);
    if (urlComponent[1] === 'apps') {
        var appType = urlComponent[2];

        if (appType === 'b') {
            filename = filename.replace('b/', '');
            filepath = path.join(rootdir, filename);
        }
        else if (appType === 'u') {
            filename = filename.replace('u/', '');
            filepath = self.storageManager.userDisk.mountpoint + '/' +
                SYSTEM.SETTINGS.SysName.replace(/\s/g, '').toLocaleLowerCase() + filename;
        }
        else {
            backToLauncher();
            return;
        }
    }
    else if (urlComponent[1] === 'lib' || urlComponent[1] === 'resources' || urlComponent[1] === 'protocol' || urlComponent[1] === 'device') {
        if (path.basename(filename) === 'jquery-ui.min.css')
            this.jqueryuiPath = path.dirname(filename);
    }
    else {
        backToLauncher();
        return;
    }

    fs.exists(filepath, function(exists) {
        if (!exists) {
            if (path.basename(filename) === 'icon.png') {
                filename = '/resources/img/unknown-icon.png';
                filepath = path.join(rootdir, filename);
            }
            else if (filename.indexOf('userdata') > 0 && filename.indexOf('assets') > 0) {
                /* Set user disk as default storage where requested userdata is on */
                var disk = self.storageManager.userDisk;

                if (query.uuid) {
                    disk = self.storageManager.getDiskByUUID(query.uuid);

                    if (SYSTEM.ERROR.HasError(disk))
                        /* Inavlid disk uuid specified, ignore this request */
                        disk = null;
                }

                if (disk)
                    filepath = disk.mountpoint + '/' + SYSTEM.SETTINGS.SysName.replace(/\s/g, '').toLocaleLowerCase() + filename;
                else
                    filepath = '';
            }
            else if (path.basename(filename).match(/^ui/) && path.basename(filename).match(/png$/)) {
                /* Rebuild jquery-ui images path */
                filename = self.jqueryuiPath + '/images/' + path.basename(filename);
                filepath = path.join(rootdir, filename);
            }
            else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found\n');
                return;
            }

            if (!filepath || !fs.existsSync(filepath)) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found\n');
                return;
            }
        }

        if (fs.lstatSync(filepath).isDirectory())
            filepath += '/' + path.basename(filepath) + '.html';

        fs.readFile(filepath, function(err, content) {
            if (err) {
                console.log(err);
                return;
            }

            var ctype = mime.lookup(filepath);
            res.writeHead(200, {'Content-Type': ctype});

            if (ctype.indexOf('text') > -1 || ctype.indexOf('javascript') > -1) {
                var contentString = content.toString().replace(/%SYSIP%/g, ip.address());
                contentString = contentString.replace(/%SYSPORT%/g, process.env.npm_package_config_port || '8001');
                contentString = contentString.replace(/%SYSNAME%/g, SYSTEM.SETTINGS.SysName);
                contentString = contentString.replace(/%BRAND%/g, SYSTEM.SETTINGS.Brand);
                contentString = contentString.replace(/%COPYRIGHT%/g, SYSTEM.SETTINGS.Copyright);
                contentString = contentString.replace(/%APPBACKGROUND%/g, SYSTEM.SETTINGS.AppBackground || '/resources/img/background.jpg');
                res.end(contentString);
            }
            else {
                res.end(content);
            }
        });
    });
}
