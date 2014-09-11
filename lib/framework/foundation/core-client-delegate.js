/* Constructor of CoreClientDelegate */
var CoreClientDelegate = function() {};
CoreClientDelegate.prototype.constructor = CoreClientDelegate;

/* Protocol delegates */
CoreClientDelegate.prototype.protoResponseProtoLoaded = function(coreClient){};
CoreClientDelegate.prototype.protoResponseExtProtoLoaded = function(coreClient){};
CoreClientDelegate.prototype.protoErrorProtoLoad = function(coreClient, error){};
CoreClientDelegate.prototype.protoErrorExtProtoLoad = function(coreClient, error){};

/* Socket.IO connection delegates */
CoreClientDelegate.prototype.connectionEstablished = function(coreClient){};
CoreClientDelegate.prototype.connectionClosed = function(coreClient){};
CoreClientDelegate.prototype.connectionFailWithError = function(coreClient, error){};

/* APP protocol delegates */
CoreClientDelegate.prototype.protoResponseAppList = function(coreClient, apps){};
CoreClientDelegate.prototype.protoResponseAppInstalling = function(coreClient, appBundle){};
CoreClientDelegate.prototype.protoResponseAppInstalled = function(coreClient, appBundle){};
CoreClientDelegate.prototype.protoResponseAppInstallCancelled = function(coreClient, appBundle){};
CoreClientDelegate.prototype.protoResponseAppUninstalled = function(coreClient, appDirectory){};
CoreClientDelegate.prototype.protoErrorAppInstall = function(coreClient, error){};
CoreClientDelegate.prototype.protoErrorAppUninstall = function(coreClient, error){};

/* Storage protocol delegates */
CoreClientDelegate.prototype.protoResponseLocalDisks = function(coreClient, disks){};
CoreClientDelegate.prototype.protoErrorGetLocalDisks = function(coreClient, error){};
