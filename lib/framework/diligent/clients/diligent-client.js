var EventEmitter = require('events').EventEmitter;
var io           = require('socket.io-client');
var ss           = require('socket.io-stream');
var assign       = require('object-assign');

var DiligentClient = assign({}, EventEmitter.prototype, {
    version: 0,
    ioClient: undefined,
    apiSpec: undefined,
    manifest: undefined,

    loadWSAPISpec: function(cb) {
        $.ajax({
            url: '%PROTO%://%SYSIP%:%SYSPORT%/api/wsapi-spec-v' + this.version + '.json',
            dataType: 'text',
            async: true,
            success: function(data) {
                var error;

                try {
                    this.apiSpec = $.parseJSON(data).MinorVersion;

                    /* Using 'forceNew' attribute to prevent problem caused by connect->disconnect->connect behavior */
                    this.ioClient = io('%PROTO%://%SYSIP%:%SYSPORT%', {
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

    init: function() {
        var self = this;

        function registerSioListeners() {
            self.ioClient.on('connect', function() {
                self.ioClient.id = self.ioClient.io.engine.id;
                NotificationCenter.attach(self);
                StorageClient.attach(self);
                ExtensionClient.attach(self);
                FileManagerClient.attach(self);
                AppManagerClient.attach(self);
                self.emit('diligent.connection#established');
            });

            self.ioClient.on('disconnect', function() {
                AppManagerClient.detach();
                FileManagerClient.detach();
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
            /**
             * WebSocket API Handshaking
             * Phase 2: Get app manifest to describe what APP this DiligentClient is serving for
             */
            self.ioClient.on(self.apiSpec[0].Base.GetManifest.RES, function(manifest) {
                self.manifest = manifest;

                if (manifest.allow_external_userdata) {
                    StorageClient.getLocalDisks();
                }

                self.emit('diligent.wsapi#loaded');
            });

            self.ioClient.on(self.apiSpec[0].Base.GetManifest.ERR, function(error) {
                alert('FATAL ERROR: Cannot get app manifest (' + error + ')');
                self.manifest = undefined;
            });
        }

        function unregisterBaseListeners() {
            /* Remove Base API response events */
            self.ioClient.removeAllListeners(self.apiSpec[0].Base.GetManifest.RES);
            self.ioClient.removeAllListeners(self.apiSpec[0].Base.GetManifest.ERR);
        }

        self.loadWSAPISpec(function(error) {
            if (!error) {
                registerSioListeners();
                registerBaseListeners();

                /**
                 * WebSocket API Handshaking
                 * Phase 1: query app manifest for current APP
                 */
                self.ioClient.emit(
                    self.apiSpec[0].Base.GetManifest.REQ,
                    {
                        type: window.location.href.split('/').reverse()[2],
                        directory: window.location.href.split('/').reverse()[1]
                    }
                );
            }
            else {
                alert('DiligentClient load api specification error: ' + error);
            }
        });
    },

    deinit: function() {

    }
});

module.exports = DiligentClient;
