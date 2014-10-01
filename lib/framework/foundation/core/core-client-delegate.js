/* Constructor of CoreClientDelegate */
function CoreClientDelegate() {};
CoreClientDelegate.prototype.constructor = CoreClientDelegate;

/* Protocol delegates */
CoreClientDelegate.prototype.protoResponseProtoLoaded = function(coreClient){};
CoreClientDelegate.prototype.protoErrorProtoLoad = function(coreClient, error){};

/* Socket.IO connection delegates */
CoreClientDelegate.prototype.connectionEstablished = function(coreClient){};
CoreClientDelegate.prototype.connectionClosed = function(coreClient){};
CoreClientDelegate.prototype.connectionFailWithError = function(coreClient, error){};

/* Extension protocol delegates */
CoreClientDelegate.prototype.protoResponseExtProtoLoaded = function(coreClient, name){};
CoreClientDelegate.prototype.protoResponseExtProtoUnloaded = function(coreClient, name){};
CoreClientDelegate.prototype.protoErrorExtProtoLoad = function(coreClient, name){};
CoreClientDelegate.prototype.protoErrorExtProtoUnload = function(coreClient, name){};

/* APP protocol delegates */
CoreClientDelegate.prototype.protoResponseAppList = function(coreClient, apps){};
CoreClientDelegate.prototype.protoResponseAppUploading = function(coreClient, installationCode){};
CoreClientDelegate.prototype.protoResponseAppInstalling = function(coreClient, installationCode){};
CoreClientDelegate.prototype.protoResponseAppInstalled = function(coreClient, installationCode){};
CoreClientDelegate.prototype.protoResponseAppInstallCancelled = function(coreClient, installationCode){};
CoreClientDelegate.prototype.protoResponseAppUninstalled = function(coreClient, appInfo){};
CoreClientDelegate.prototype.protoErrorAppInstall = function(coreClient, error){};
CoreClientDelegate.prototype.protoErrorAppUninstall = function(coreClient, error){};

/* Storage protocol delegates */
CoreClientDelegate.prototype.protoResponseLocalDisks = function(coreClient, disks){};
CoreClientDelegate.prototype.protoErrorGetLocalDisks = function(coreClient, error){};
