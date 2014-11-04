include('lib/framework/foundation/fs/socket.io-stream.js');

function FileManagerClient() {}

FileManagerClient.prototype.register = function(_super) {
    var self = this;

    this.delegate = _super;
    this.socket = _super.ioClient;
    this.protoFS = _super.protocol[0].FileSystem;
    this.api = [];

    this.addApiCallback = function(api, index, callback) {
        self.api[api] = self.api[api] || [];
        self.api[api][index] = self.api[api][index] || [];
        self.api[api][index].push(callback);
    };

    this.forEachApiCallback = function(api, index, func) {
        self.api[api] = self.api[api] || [];
        for (var i in self.api[api][index])
            func(self.api[api][index][i]);
        self.api[api][index] = [];
    };

    /* Dispatch file system protocol response events */
    this.socket.on(this.protoFS.List.RES, function(path, items) {
        self.forEachApiCallback('List', path, function(apiCallback) {
            apiCallback(path, items, null);
        });

        self.forEachApiCallback('IterateList', path, function(apiCallback) {
            for (var i in items)
                apiCallback(path, items[i], i, null);
        });
    });

    this.socket.on(this.protoFS.List.ERR, function(path, error) {
        self.forEachApiCallback('List', path, function(apiCallback) {
            apiCallback(path, null, -1, error);
        });
    });

    this.socket.on(this.protoFS.CreateFile.RES, function(path) {
        self.forEachApiCallback('CreateFile', path, function(apiCallback) {
            apiCallback(path, null);
        });
    });

    this.socket.on(this.protoFS.CreateFile.ERR, function(path, error) {
        self.forEachApiCallback('CreateFile', path, function(apiCallback) {
            apiCallback(path, error);
        });
    });

    this.socket.on(this.protoFS.CreateDirectory.RES, function(path) {
        self.forEachApiCallback('CreateDirectory', path, function(apiCallback) {
            apiCallback(path, null);
        });
    });

    this.socket.on(this.protoFS.CreateDirectory.ERR, function(path, error) {
        self.forEachApiCallback('CreateDirectory', path, function(apiCallback) {
            apiCallback(path, error);
        });
    });

    this.socket.on(this.protoFS.CreateHardLink.RES, function(src, dst) {
        self.forEachApiCallback('CreateHardLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
        });
    });

    this.socket.on(this.protoFS.CreateHardLink.ERR, function(src, dst, error) {
        self.forEachApiCallback('CreateHardLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
        });
    });

    this.socket.on(this.protoFS.CreateSymbolicLink.RES, function(src, dst) {
        self.forEachApiCallback('CreateSymbolicLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
        });
    });

    this.socket.on(this.protoFS.CreateSymbolicLink.ERR, function(src, dst, error) {
        self.forEachApiCallback('CreateSymbolicLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
        });
    });

    this.socket.on(this.protoFS.Remove.RES, function(path) {
        self.forEachApiCallback('Remove', path, function(apiCallback) {
            apiCallback(path, null);
        });
    });

    this.socket.on(this.protoFS.Remove.ERR, function(path, error) {
        self.forEachApiCallback('Remove', path, function(apiCallback) {
            apiCallback(path, error);
        });
    });

    this.socket.on(this.protoFS.Move.RES, function(src, dst) {
        self.forEachApiCallback('Move', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
        });
    });

    this.socket.on(this.protoFS.Move.ERR, function(src, dst, error) {
        self.forEachApiCallback('Move', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
        });
    });

    this.socket.on(this.protoFS.Copy.RES, function(src, dst) {
        self.forEachApiCallback('Copy', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
        });
    });

    this.socket.on(this.protoFS.Copy.ERR, function(src, dst, error) {
        self.forEachApiCallback('Copy', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
        });
    });

    this.socket.on(this.protoFS.Exist.RES, function(path, exist, isDir) {
        self.forEachApiCallback('Exist', path, function(apiCallback) {
            apiCallback(path, exist, isDir, null);
        });
    });
    this.socket.on(this.protoFS.Exist.ERR, function(path, error) {
        self.forEachApiCallback('Exist', path, function(apiCallback) {
            apiCallback(path, false, false, error);
        });
    });

    this.socket.on(this.protoFS.ReadFile.RES, function(path, data) {
        self.forEachApiCallback('ReadFile', path, function(apiCallback) {
            apiCallback(path, data.data, null);
        });
    });

    this.socket.on(this.protoFS.ReadFile.ERR, function(path, error) {
        self.forEachApiCallback('ReadFile', path, function(apiCallback) {
            apiCallback(path, null, error);
        });
    });

    this.socket.on(this.protoFS.WriteFile.RES, function(path) {
        self.forEachApiCallback('WriteFile', path, function(apiCallback) {
            apiCallback(path, null);
        });
    });

    this.socket.on(this.protoFS.WriteFile.ERR, function(path, error) {
        self.forEachApiCallback('WriteFile', path, function(apiCallback) {
            apiCallback(path, error);
        });
    });

    this.socket.on(this.protoFS.AppendFile.RES, function(path) {
        self.forEachApiCallback('AppendFile', path, function(apiCallback) {
            apiCallback(path, null);
        });
    });

    this.socket.on(this.protoFS.AppendFile.ERR, function(path, error) {
        self.forEachApiCallback('AppendFile', path, function(apiCallback) {
            apiCallback(path, error);
        });
    });

    this.socket.on(this.protoFS.Open.RES, function(path, fileHandle) {
        self.forEachApiCallback('Open', path, function(apiCallback) {
            apiCallback(path, fileHandle, null);
        });
    });

    this.socket.on(this.protoFS.Open.ERR, function(path, error) {
        self.forEachApiCallback('Open', path, function(apiCallback) {
            apiCallback(path, null, error);
        });
    });

    this.socket.on(this.protoFS.Close.RES, function(fileHandle) {
        self.forEachApiCallback('Close', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, null);
        });
    });

    this.socket.on(this.protoFS.Close.ERR, function(fileHandle, error) {
        self.forEachApiCallback('Close', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, error);
        });
    });

    this.socket.on(this.protoFS.ReadData.RES, function(fileHandle, data, bytesRead) {
        self.forEachApiCallback('ReadData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, data, bytesRead, null);
        });
    });

    this.socket.on(this.protoFS.ReadData.ERR, function(fileHandle, error) {
        self.forEachApiCallback('ReadData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, null, 0, error);
        });
    });

    this.socket.on(this.protoFS.WriteData.RES, function(fileHandle, bytesWritten) {
        self.forEachApiCallback('WriteData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, bytesWritten, null);
        });
    });

    this.socket.on(this.protoFS.WriteData.ERR, function(fileHandle, error) {
        self.forEachApiCallback('WriteData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, 0, error);
        });
    });
}

FileManagerClient.prototype.unregister = function() {
    /* Remove file system protocol response events */
    this.socket.removeAllListeners(this.protoFS.List.RES);
    this.socket.removeAllListeners(this.protoFS.List.ERR);
    this.socket.removeAllListeners(this.protoFS.CreateFile.RES);
    this.socket.removeAllListeners(this.protoFS.CreateFile.ERR);
    this.socket.removeAllListeners(this.protoFS.CreateDirectory.RES);
    this.socket.removeAllListeners(this.protoFS.CreateDirectory.ERR);
    this.socket.removeAllListeners(this.protoFS.CreateHardLink.RES);
    this.socket.removeAllListeners(this.protoFS.CreateHardLink.ERR);
    this.socket.removeAllListeners(this.protoFS.CreateSymbolicLink.RES);
    this.socket.removeAllListeners(this.protoFS.CreateSymbolicLink.ERR);
    this.socket.removeAllListeners(this.protoFS.Remove.RES);
    this.socket.removeAllListeners(this.protoFS.Remove.ERR);
    this.socket.removeAllListeners(this.protoFS.Move.RES);
    this.socket.removeAllListeners(this.protoFS.Move.ERR);
    this.socket.removeAllListeners(this.protoFS.Copy.RES);
    this.socket.removeAllListeners(this.protoFS.Copy.ERR);
    this.socket.removeAllListeners(this.protoFS.Exist.RES);
    this.socket.removeAllListeners(this.protoFS.Exist.ERR);
    this.socket.removeAllListeners(this.protoFS.ReadFile.RES);
    this.socket.removeAllListeners(this.protoFS.ReadFile.ERR);
    this.socket.removeAllListeners(this.protoFS.WriteFile.RES);
    this.socket.removeAllListeners(this.protoFS.WriteFile.ERR);
    this.socket.removeAllListeners(this.protoFS.AppendFile.RES);
    this.socket.removeAllListeners(this.protoFS.AppendFile.ERR);
    this.socket.removeAllListeners(this.protoFS.Open.RES);
    this.socket.removeAllListeners(this.protoFS.Open.ERR);
    this.socket.removeAllListeners(this.protoFS.Close.RES);
    this.socket.removeAllListeners(this.protoFS.Close.ERR);
    this.socket.removeAllListeners(this.protoFS.ReadData.RES);
    this.socket.removeAllListeners(this.protoFS.ReadData.ERR);
    this.socket.removeAllListeners(this.protoFS.WriteData.RES);
    this.socket.removeAllListeners(this.protoFS.WriteData.ERR);

    this.delegate = undefined;
    this.socket = undefined;
    this.protoFS = undefined;
}

/* File system client APIs */
FileManagerClient.prototype.list = function(path, func) {
    this.addApiCallback('List', path, func);
    this.socket.emit(this.protoFS.List.REQ, path);
};

FileManagerClient.prototype.iterateList = function(path, func) {
    this.addApiCallback('IterateList', path, func);
    this.socket.emit(this.protoFS.List.REQ, path);
};

FileManagerClient.prototype.createFile = function(path, func) {
    this.addApiCallback('CreateFile', path, func);
    this.socket.emit(this.protoFS.CreateFile.REQ, path);
};

FileManagerClient.prototype.createDirectory = function(path, func) {
    this.addApiCallback('CreateDirectory', path, func);
    this.socket.emit(this.protoFS.CreateDirectory.REQ, path);
};

FileManagerClient.prototype.createHardLink = function(src, dst, func) {
    this.addApiCallback('CreateHardLink', src + dst, func);
    this.socket.emit(this.protoFS.CreateHardLink.REQ, src, dst);
};

FileManagerClient.prototype.createSymbolicLink = function(src, dst, func) {
    this.addApiCallback('CreateSymbolicLink', src + dst, func);
    this.socket.emit(this.protoFS.CreateSymbolicLink.REQ, src, dst);
};

FileManagerClient.prototype.remove = function(path, func) {
    this.addApiCallback('Remove', path, func);
    this.socket.emit(this.protoFS.Remove.REQ, path);
};

FileManagerClient.prototype.move = function(src, dst, func) {
    this.addApiCallback('Move', src + dst, func);
    this.socket.emit(this.protoFS.Move.REQ, src, dst);
};

FileManagerClient.prototype.copy = function(src, dst, func) {
    this.addApiCallback('Copy', src + dst, func);
    this.socket.emit(this.protoFS.Copy.REQ, src, dst);
};

FileManagerClient.prototype.exist = function(path, func) {
    this.addApiCallback('Exist', path, func);
    this.socket.emit(this.protoFS.Exist.REQ, path);
};

FileManagerClient.prototype.readFile = function(path, encoding, func) {
    this.addApiCallback('ReadFile', path, func);
    this.socket.emit(this.protoFS.ReadFile.REQ, path, encoding);
};

FileManagerClient.prototype.writeFile = function(path, data, func) {
    this.addApiCallback('WriteFile', path, func);

    var dataStream = ss.createStream();
    ss(this.socket).emit(this.protoFS.WriteFile.REQ, path, dataStream);

    var blobStream = ss.createBlobReadStream(new Blob([data]));
    blobStream.pipe(dataStream);
};

FileManagerClient.prototype.appendFile = function(path, data, func) {
    this.addApiCallback('AppendFile', path, func);

    var dataStream = ss.createStream();
    ss(this.socket).emit(this.protoFS.AppendFile.REQ, path, dataStream);

    var blobStream = ss.createBlobReadStream(new Blob([data]));
    blobStream.pipe(dataStream);
};

FileManagerClient.prototype.open = function(path, flag, mode, func) {
    this.addApiCallback('Open', path, func);
    this.socket.emit(this.protoFS.Open.REQ, path, flag, mode);
};

FileManagerClient.prototype.close = function(fileHandle, func) {
    this.addApiCallback('Close', fileHandle, func);
    this.socket.emit(this.protoFS.Close.REQ, fileHandle);
};

FileManagerClient.prototype.readData = function(fileHandle, offset, size, func) {
    this.addApiCallback('ReadData', fileHandle, func);
    this.socket.emit(this.protoFS.ReadData.REQ, fileHandle, offset, size);
};

FileManagerClient.prototype.writeData = function(fileHandle, offset, size, data, func) {
    this.addApiCallback('WriteData', fileHandle, func);
    this.socket.emit(this.protoFS.WriteData.REQ, fileHandle, offset, size, data);
};
