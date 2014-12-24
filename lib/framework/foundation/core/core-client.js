function CoreClient() {
    this.version = 0;
    this.ioClient = undefined;
    this.protocol = undefined;
    this.appInfo = undefined;
    this.notificationCenter = new NotificationCenter();
    this.storageClient = new StorageClient();
}

extend(CoreClient.prototype, Event.prototype);

CoreClient.prototype.initiate = function() {
    var self = this;

    function loadProtoSpec() {
        var result = false;
        var protoSpec = 'ProtoSpec-v' + self.version;

        $.ajax({
            url: 'http://%SYSIP%:%SYSPORT%/protocol/' + protoSpec + '.json',
            dataType: 'text',
            async: false,
            success: function(data) {
                try {
                    self.protocol = $.parseJSON(data).MinorVersion;

                    /* Using 'forceNew' attribute to prevent problem caused by connect->disconnect->connect behavior */
                    self.ioClient = io('http://%SYSIP%:%SYSPORT%', { 'forceNew': true, 'pingTimeout': 300000 });

                    result = true;
                }
                catch (error) {
                    self.event.trigger('core.protospec#error', error);
                }
            }
        });

        return result;
    }

    function registerSioListeners() {
        self.ioClient.on('connect', function() {
            self.ioClient.id = self.ioClient.io.engine.id;
            self.event.trigger('core.connection#established');
            self.notificationCenter.attach(self);
            self.storageClient.attach(self);
        });

        self.ioClient.on('disconnect', function() {
            self.notificationCenter.detach();
            self.storageClient.detach();
            self.event.trigger('core.connection#closed');
            unregisterProtoListeners();
            unregisterSioListeners();
        });

        self.ioClient.on('connect_error', function(error) {
            self.event.trigger('core.connection#error', error);
        });
    }

    function unregisterSioListeners() {
        self.ioClient.removeAllListeners('connect');
        self.ioClient.removeAllListeners('disconnect');
        self.ioClient.removeAllListeners('connect_error');
    }

    function registerProtoListeners() {
        /* Protocol handshaking: 2) Get AppInfo to describe what APP this CoreClient is serving for */
        self.ioClient.on(self.protocol[0].Base.GetInfo.RES, function(appInfo) {
            self.appInfo = appInfo;

            if (appInfo.AllowExternalUserData) {
                self.storageClient.getLocalDisks();
            }

            self.event.trigger('core.protospec#loaded');
        });

        self.ioClient.on(self.protocol[0].Base.GetInfo.ERR, function(error) {
            alert('FATAL ERROR: Cannot get AppInfo (' + error + ')');
            self.appInfo = undefined;
        });
    }

    function unregisterProtoListeners() {
        /* Remove Base protocol response events */
        self.ioClient.removeAllListeners(self.protocol[0].Base.GetInfo.RES);
        self.ioClient.removeAllListeners(self.protocol[0].Base.GetInfo.ERR);
    }

    if (loadProtoSpec()) {
        registerSioListeners();
        registerProtoListeners();

        /* Start protocol handshaking: 1) query AppInfo for current APP */
        self.ioClient.emit(this.protocol[0].Base.GetInfo.REQ, basename(dirname(window.location.href)));
    }
    else alert('CoreClient load proto specification error');
}
