var EventEmitter = require('events').EventEmitter;
var io           = require('socket.io-client');
var ss           = require('socket.io-stream');
var assign       = require('object-assign');

var DiligentClient = assign({}, EventEmitter.prototype, {
    version  : 0,
    status   : 'IDLE',
    error    : '',
    ioClient : undefined,
    wsapi    : undefined,
    manifest : undefined,

    notificationCenter : require('./notification-center'),
    storageManager     : require('./storage-manager'),
    appManager         : require('./app-manager'),
    extensionManager   : require('./extension-manager'),
    fileManager        : require('./file-manager'),

    loadWSApi: function(cb) {
        /**
         * Diligent Client Startup Procedure
         * #1: Get WSAPI spec
         */
        this.status = 'GETTING_API_SPEC';

        $.ajax({
            url: '%PROTO%://%SYSIP%:%SYSPORT%/api/wsapi-spec-v' + this.version + '.json',
            dataType: 'text',
            async: true,
            success: function(data) {
                try {
                    this.status = 'PARSING_API_SPEC';
                    this.wsapi = $.parseJSON(data).MinorVersion;
                }
                catch (e) {
                    this.emit('diligent.wsapi.error', e);
                    this.error = e;
                }
                finally {
                    cb(this.error);
                }
            }.bind(this)
        });
    },

    initiate: function() {
        this.loadWSApi(function(error) {
            if (error) {
                this.error = error;
            }
            else {
                /**
                 * Diligent Client Startup Procedure
                 * #2: Initiate socket.io connection to server
                 */
                this.status = 'INITIATING_DILIGENT_CONNECTION';

                this.ioClient = io('%PROTO%://%SYSIP%:%SYSPORT%', {
                    /* 'forceNew' attribute avoid problem caused by connect->disconnect->connect behavior */
                    'forceNew': true,
                    'reconnectionAttempts': 5,
                    'reconnectionDelay': 3000,
                    'pingTimeout': 300000
                });

                /**
                 * Diligent Client Startup Procedure
                 * #3: Attach service managers to the connection
                 */
                this.ioClient.on('connect', function() {
                    this.status = 'DILIGENT_CONNECTION_ESTABLISHED';
                    this.ioClient.id = this.ioClient.io.engine.id;
                    this.notificationCenter.attach(this);
                    this.storageManager.attach(this);
                    this.extensionManager.attach(this);
                    this.fileManager.attach(this);
                    this.appManager.attach(this);
                    this.emit('diligent.connection.established');

                    /**
                     * Diligent Client Startup Procedure
                     * #4: Get app manifest
                     */
                    this.status = 'GETTING_APP_MANIFEST';

                    this.ioClient.emit(
                        this.wsapi[0].Base.GetManifest.REQ,
                        {
                            type: window.location.href.split('/').reverse()[2],
                            directory: window.location.href.split('/').reverse()[1]
                        }
                    );
                }.bind(this));

                this.ioClient.on('disconnect', function() {
                    this.appManager.detach();
                    this.fileManager.detach();
                    this.extensionManager.detach();
                    this.notificationCenter.detach();
                    this.storageManager.detach();
                    this.emit('diligent.connection.closed');

                    /* Remove Base API response events */
                    this.ioClient.removeAllListeners(this.wsapi[0].Base.GetManifest.RES);
                    this.ioClient.removeAllListeners(this.wsapi[0].Base.GetManifest.ERR);

                    this.ioClient.removeAllListeners('connect');
                    this.ioClient.removeAllListeners('disconnect');
                    this.ioClient.removeAllListeners('connect_error');

                    this.status = 'DILIGENT_CONNECTION_CLOSED';
                }.bind(this));

                this.ioClient.on('connect_error', function(error) {
                    this.status = 'DILIGENT_CONNECTION_ERROR';
                    this.error = error;
                    this.emit('diligent.connection.error', error);
                }.bind(this));

                /**
                 * Diligent Client Startup Procedure
                 * #5: Server returns manifest to describe the running app
                 */
                this.ioClient.on(this.wsapi[0].Base.GetManifest.RES, function(manifest) {
                    this.status = 'DILIGENT_CLIENT_RUNNING';
                    this.manifest = manifest;
                    this.emit('diligent.wsapi.loaded');
                }.bind(this));

                this.ioClient.on(this.wsapi[0].Base.GetManifest.ERR, function(error) {
                    this.error = error;
                    this.manifest = undefined;
                }.bind(this));
            }
        }.bind(this));
    },

    terminate: function() {

    }
});

module.exports = DiligentClient;
