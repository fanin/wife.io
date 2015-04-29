/*
 * TODOs & FIXMEs:
 * 1) Introduce express to handle APP routing
 * 2) Fix unusual '/apps/b/launcher/' request
 */

"use strict";

var sio                = require('socket.io'),
    util               = require('util'),
    fs                 = require('fs-extra'),
    path               = require('path'),
    mime               = require('mime'),
    async              = require('async'),
    EventEmitter       = require('events').EventEmitter,
    randomstring       = require('./lib/randomstring'),
    ExtensionManager   = require('./extension-manager'),
    SecurityManager    = require('./security-manager'),
    NotificationCenter = require('./notification-center'),
    AppManager         = require('./app-manager'),
    FileManager        = require('./file-manager'),
    StorageManager     = require('./storage-manager');

var SYSTEM = require('./system');

module.exports = DiligentServer;

function DiligentServer(http) {
    this.ioServer = sio(http, { 'pingTimeout': 300000 });
    this.error = null;

    this.loadWSApi = function(name, version) {
        var apiSpec = name + '-v' + version;

        var jsonString = fs.readFileSync(path.resolve(__dirname, '../api/' + apiSpec + '.json'));
        if (jsonString) {
            try {
                var p = JSON.parse(jsonString);
                console.log('API [' + apiSpec + '] version: ' + p.MajorVersion);
                return p.MinorVersion;
            }
            catch (err) {
                //console.log('API error: ' + err);
                this.error = SYSTEM.ERROR.ERROR_WSAPI_PARSE;
                return null;
            }
        }
        else {
            //console.log('API not specified');
            this.error = SYSTEM.ERROR.ERROR_WSAPI_READ;
            return null;
        }
    }

    this.apiSpec = this.loadWSApi('wsapi-spec', 0);
    if (!this.apiSpec) {
        console.log('Unable to load API Spec, error = ' + this.error);
        process.exit(1);
    }

    this.securityManager    = new SecurityManager(this);
    this.extensionManager   = new ExtensionManager(this, this.apiSpec[0].Extension);
    this.notificationCenter = new NotificationCenter(this, this.apiSpec[0].Notification);
    this.storageManager     = new StorageManager(this, this.apiSpec[0].Storage);
    this.appManager         = new AppManager(this, this.apiSpec[0].APP);
    this.fileManager        = new FileManager(this, this.apiSpec[0].FileSystem);
}

DiligentServer.prototype.listen = function() {
    var self = this;

    this.ioServer.on('connection', function(socket) {
        /* Handle api initiate handshaking */
        socket.on(self.apiSpec[0].Base.GetManifest.REQ, function(appInfo) {
            var manifest = self.appManager.getAppManifest(appInfo.type, appInfo.directory);

            if (!SYSTEM.ERROR.HAS_ERROR(manifest)) {
                async.series([
                    function(callback) {
                        /* Create security manager for this app (connection) */
                        self.securityManager.register(socket, manifest, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register extension manager */
                        self.extensionManager.register(socket, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register notification center */
                        self.notificationCenter.register(socket, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register storage manager (must be done before registering app manager & file manager */
                        self.storageManager.register(socket, function(error) {
                            callback(error, true);
                        });
                    },
                    function(callback) {
                        /* Register app manager */
                        self.appManager.register(socket, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        /* Register file manager */
                        self.fileManager.register(socket, function() {
                            callback(null, true);
                        });
                    },
                    function(callback) {
                        socket.on('disconnect', function() {
                            /* Unregister api for this app */
                            self.fileManager.unregister(socket);
                            self.appManager.unregister(socket);
                            self.notificationCenter.unregister(socket);
                            self.extensionManager.unregister(socket);
                            self.storageManager.unregister(socket);
                            self.securityManager.unregister(socket);

                            socket.removeAllListeners(self.apiSpec[0].Base.GetManifest.REQ);
                            socket.removeAllListeners('disconnect');
                        });

                        callback(null, true);
                    }
                ],
                function(err, results) {
                    /* Response app manifest to app client */
                    socket.emit(self.apiSpec[0].Base.GetManifest.RES, manifest);
                });
            }
            else
                socket.emit(self.apiSpec[0].Base.GetManifest.ERR, manifest);
        });
    });
}

DiligentServer.prototype.handleRequest = function(req, res) {
    var url = require('url').parse(req.url, true);
    var filename = path.normalize(url.pathname);
    var query = url.query;
    var rootdir = path.dirname(__dirname);
    var filepath = path.join(rootdir, filename);

    if (req.headers.host.split(":")[0] === 'localhost' || req.headers.host.split(":")[0] === '127.0.0.1')
        res.setHeader('Access-Control-Allow-Origin', SYSTEM.SETTINGS.web_protocol + '://' + req.headers.host);

    function backToLauncher() {
        // Redirect to launcher
        res.writeHead(301, {
            "location" : SYSTEM.SETTINGS.web_protocol + '://' + req.headers.host + '/apps/b/launcher/'
        });
        res.end();
    }

    /* Route allowed URL to real path */
    var urlComponent = filename.split(path.sep);
    if (urlComponent[1] === 'apps') {
        var appType = urlComponent[2];

        if (appType === 'b') {
            filename = filename.replace('b' + path.sep, '');
            filepath = path.join(rootdir, filename);
        }
        else if (appType === 'u') {
            filename = filename.replace('u' + path.sep, '');
            filepath = SYSTEM.SETTINGS.sys_data_path + path.sep +
                SYSTEM.SETTINGS.sys_name.replace(/\s/g, '').toLocaleLowerCase() + filename;
        }
        else {
            console.log('Access denied: ' + req.url);
            backToLauncher();
            return;
        }
    }
    else if (urlComponent[1] === 'lib' ||
             urlComponent[1] === 'resources' ||
             urlComponent[1] === 'api' ||
             urlComponent[1] === 'device' ||
             urlComponent[1] === 'favicon.ico') {
        if (path.basename(filename) === 'jquery-ui.min.css')
            this.jqueryuiPath = path.dirname(filename);
    }
    else if (url.pathname === '/') {
        backToLauncher();
        return;
    }
    else {
        console.log('Access denied: ' + url.pathname);
        res.writeHead(404, {'Content-Type': 'text/plain'});
        return;
    }

    fs.exists(filepath, function(exists) {
        if (!exists) {
            if (path.basename(filename) === 'icon.png') {
                filename = path.normalize('/resources/img/unknown-icon.png');
                filepath = path.join(rootdir, filename);
            }
            else if (path.basename(filename) === 'favicon.ico') {
                filename = path.normalize('/resources/img/favicon.ico');
                filepath = path.join(rootdir, filename);
            }
            else if (filename.indexOf('userdata') > 0 && filename.indexOf('assets') > 0) {
                var dataPath = null;

                if (query.uuid) {
                    var disk = this.storageManager.getDiskByUUID(query.uuid);

                    if (SYSTEM.ERROR.HAS_ERROR(disk))
                        /* Inavlid disk uuid specified, ignore this request */
                        dataPath = null;
                    else if (disk.mountpoint === this.storageManager.systemDisk.mountpoint)
                        dataPath = SYSTEM.SETTINGS.sys_data_path;
                    else
                        dataPath = disk.mountpoint;
                }
                else {
                    dataPath = SYSTEM.SETTINGS.sys_data_path;
                }

                if (dataPath)
                    filepath = dataPath + path.sep + SYSTEM.SETTINGS.sys_name.replace(/\s/g, '').toLocaleLowerCase() + filename;
                else
                    filepath = '';
            }
            else if (path.basename(filename).match(/^ui/) && path.basename(filename).match(/png$/)) {
                /* Rebuild jquery-ui images path */
                filename = this.jqueryuiPath + path.normalize('/images/') + path.basename(filename);
                filepath = path.join(rootdir, filename);
            }
            else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found\n');
                return;
            }

            if (!filepath || !fs.existsSync(path.normalize(filepath))) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found\n');
                return;
            }
        }

        if (fs.lstatSync(filepath).isDirectory())
            filepath += path.sep + 'index.html';

        filepath = path.normalize(filepath);

        fs.readFile(filepath, function(err, content) {
            if (err) {
                console.log(err);
                return;
            }

            var ctype = mime.lookup(filepath);
            res.writeHead(200, {'Content-Type': ctype});

            if (ctype.indexOf('text') > -1 || ctype.indexOf('javascript') > -1) {
                var contentString = content.toString().replace(/%PROTO%/g, SYSTEM.SETTINGS.web_protocol);
                contentString = contentString.replace(/%SYSIP%/g, req.headers.host.split(":")[0]);
                contentString = contentString.replace(/%SYSPORT%/g, req.headers.host.split(":")[1] || '8001');
                contentString = contentString.replace(/%SYSNAME%/g, SYSTEM.SETTINGS.sys_name);
                contentString = contentString.replace(/%BRAND%/g, SYSTEM.SETTINGS.brand);
                contentString = contentString.replace(/%COPYRIGHT%/g, SYSTEM.SETTINGS.copyright);
                contentString = contentString.replace(/%APPBACKGROUND%/g, SYSTEM.SETTINGS.app_background || '/resources/img/background.jpg');
                res.end(contentString);
            }
            else {
                res.end(content);
            }
        });
    }.bind(this));
}
