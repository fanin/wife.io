var EventEmitter = require('events').EventEmitter;
var io           = require('socket.io-client');
var ss           = require('socket.io-stream');
var utils        = require('../utils/utils');
var assign       = require('object-assign');

var DiligentClient = assign({}, EventEmitter.prototype, {
    version: 0,
    ioClient: undefined,
    apiSpec: undefined,
    appInfo: undefined,
    loadWSAPISpec: function(cb) {
        $.ajax({
            url: 'http://%SYSIP%:%SYSPORT%/api/wsapi-spec-v' + this.version + '.json',
            dataType: 'text',
            async: true,
            success: function(data) {
                var error;

                try {
                    this.apiSpec = $.parseJSON(data).MinorVersion;

                    /* Using 'forceNew' attribute to prevent problem caused by connect->disconnect->connect behavior */
                    this.ioClient = io('http://%SYSIP%:%SYSPORT%', {
                        'forceNew': true,
                        'reconnectionAttempts': 5,
                        'reconnectionDelay': 3000,
                        'pingTimeout': 300000
                    });
                }
                catch (e) {
                    this.emit('diligent.wsapi#error', e);
                    error = e;
                }
                finally {
                    cb(error);
                }
            }.bind(this)
        });
    },
    initiate: function() {
        var self = this;

        function registerSioListeners() {
            self.ioClient.on('connect', function() {
                self.ioClient.id = self.ioClient.io.engine.id;
                NotificationCenter.attach(self);
                StorageClient.attach(self);
                ExtensionClient.attach(self);
                self.emit('diligent.connection#established');
            });

            self.ioClient.on('disconnect', function() {
                ExtensionClient.detach();
                NotificationCenter.detach();
                StorageClient.detach();
                self.emit('diligent.connection#closed');
                unregisterBaseListeners();
                unregisterSioListeners();
            });

            self.ioClient.on('connect_error', function(error) {
                self.emit('diligent.connection#error', error);
            });
        }

        function unregisterSioListeners() {
            self.ioClient.removeAllListeners('connect');
            self.ioClient.removeAllListeners('disconnect');
            self.ioClient.removeAllListeners('connect_error');
        }

        function registerBaseListeners() {
            /* WebSocket API handshaking phase 2: Get AppInfo to describe what APP this DiligentClient is serving for */
            self.ioClient.on(self.apiSpec[0].Base.GetInfo.RES, function(appInfo) {
                self.appInfo = appInfo;

                if (appInfo.AllowExternalUserData) {
                    StorageClient.getLocalDisks();
                }

                self.emit('diligent.wsapi#loaded');
            });

            self.ioClient.on(self.apiSpec[0].Base.GetInfo.ERR, function(error) {
                alert('FATAL ERROR: Cannot get AppInfo (' + error + ')');
                self.appInfo = undefined;
            });
        }

        function unregisterBaseListeners() {
            /* Remove Base API response events */
            self.ioClient.removeAllListeners(self.apiSpec[0].Base.GetInfo.RES);
            self.ioClient.removeAllListeners(self.apiSpec[0].Base.GetInfo.ERR);
        }

        self.loadWSAPISpec(function(error) {
            if (!error) {
                registerSioListeners();
                registerBaseListeners();

                /* WebSocket API handshaking phase 1: query AppInfo for current APP */
                self.ioClient.emit(
                    self.apiSpec[0].Base.GetInfo.REQ,
                    utils.basename(utils.dirname(window.location.href))
                );
            }
            else {
                alert('DiligentClient load api specification error: ' + error);
            }
        });
    }
});

module.exports = DiligentClient;
