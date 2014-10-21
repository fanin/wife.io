function CoreClient() {
    this.version = 0;
    this.ioClient = undefined;
    this.protocol = undefined;
    this.delegate = this;
    this.appInfo = undefined;
}

extend(CoreClient.prototype, ConnectionDelegate.prototype);
extend(CoreClient.prototype, ProtocolDelegate.prototype);

CoreClient.prototype.initiate = function() {
    var self = this;

    function loadProtoSpec() {
        var result = false;
        var protoSpec = 'ProtoSpec-v' + self.version;

        $.ajax({
            url: 'http://%SYSIP%:8001/protocol/' + protoSpec + '.json',
            dataType: 'text',
            async: false,
            success: function(data) {
                try {
                    self.protocol = $.parseJSON(data).MinorVersion;

                    /* Using 'forceNew' attribute to fix connect->disconnect->connect fail problem */
                    self.ioClient = io('http://%SYSIP%:8001', { 'forceNew': true, 'pingTimeout': 300000 });

                    result = true;
                }
                catch (error) {
                    self.delegate.protoDidFailLoadSpecWithError(error);
                }
            }
        });

        return result;
    }

    function registerSioListeners(socket) {
        socket.on('connect', function() {
            self.delegate.connectionDidEstablish();
        });

        socket.on('disconnect', function() {
            self.delegate.connectionDidClose();
            unregisterProtoListeners(socket);
            unregisterSioListeners(socket);
        });

        socket.on('connect_error', function(error) {
            self.delegate.connectionDidFailWithError(error);
        });
    }

    function unregisterSioListeners(socket) {
        socket.removeAllListeners('connect');
        socket.removeAllListeners('disconnect');
        socket.removeAllListeners('connect_error');
    }

    function registerProtoListeners(socket) {
        /* Protocol handshaking: 2) Get AppInfo to describe what APP this CoreClient is serving for */
        socket.on(self.protocol[0].Base.GetInfo.RES, function(appInfo) {
            self.appInfo = appInfo;
            self.delegate.protoDidLoadSpec();
        });

        socket.on(self.protocol[0].Base.GetInfo.ERR, function(error) {
            alert('FATAL ERROR: Cannot get AppInfo (' + error + ')');
            self.appInfo = undefined;
        });
    }

    function unregisterProtoListeners(socket) {
        /* Remove Base protocol response events */
        socket.removeAllListeners(self.protocol[0].Base.GetInfo.RES);
        socket.removeAllListeners(self.protocol[0].Base.GetInfo.ERR);
    }

    if (loadProtoSpec()) {
        registerSioListeners(this.ioClient);
        registerProtoListeners(this.ioClient);

        /* Start protocol handshaking: 1) query AppInfo for current APP */
        this.ioClient.emit(this.protocol[0].Base.GetInfo.REQ, basename(dirname(window.location.href)));
    }
    else alert('CoreClient load proto specification error');
}