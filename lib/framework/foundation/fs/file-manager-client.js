include('lib/framework/foundation/fs/socket.io-stream.js');

function FileManagerClient() {}

FileManagerClient.prototype.attach = function(_super) {
    var self = this;

    this.socket = _super.ioClient;
    this.protoFS = _super.protocol[0].FileSystem;
    this.api = [];

    this.queueApiCallback = function(api, index, callback) {
        if (!callback) return;
        self.api[api] = self.api[api] || [];
        self.api[api][index] = self.api[api][index] || [];
        self.api[api][index].unshift(callback);
    };

    this.dequeueApiCallback = function(api, index, onComplete) {
        if (!onComplete) return;
        self.api[api] = self.api[api] || [];
        if (self.api[api][index] && self.api[api][index].length > 0) {
            var cb = self.api[api][index][self.api[api][index].length - 1];
            if (onComplete(cb))
                self.api[api][index].pop();
        }
    };

    this.dequeueAllApiCallback = function(api, index, onComplete) {
        if (!onComplete) return;
        self.api[api] = self.api[api] || [];
        for (var i = self.api[api][index].length - 1; i >= 0; i--)
            if (onComplete(self.api[api][index][i]))
                self.api[api][index].pop();
    };

    /* Dispatch file system protocol response events */
    this.socket.on(this.protoFS.List.RES, function(path, items) {
        self.dequeueApiCallback('List', path, function(apiCallback) {
            apiCallback(path, items, null);
            return true;
        });

        self.dequeueApiCallback('IterateList', path, function(apiCallback) {
            for (var i in items)
                apiCallback(path, items[i], i, null);

            self.dequeueApiCallback('IterateListFinish', path, function(apiCallback) {
                apiCallback(path);
                return true;
            });

            return true;
        });
    });

    this.socket.on(this.protoFS.List.ERR, function(path, error) {
        self.dequeueApiCallback('List', path, function(apiCallback) {
            apiCallback(path, null, -1, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.StatList.RES, function(path, items, stats) {
        self.dequeueApiCallback('StatList', path, function(apiCallback) {
            apiCallback(path, items, stats, null);
            return true;
        });

        self.dequeueApiCallback('IterateStatList', path, function(apiCallback) {
            for (var i in items)
                apiCallback(path, items[i], stats[i], i, null);
            return true;
        });

        self.dequeueApiCallback('IterateStatListFinish', path, function(apiCallback) {
            apiCallback(path);
            return true;
        });
    });

    this.socket.on(this.protoFS.StatList.ERR, function(path, error) {
        self.dequeueApiCallback('StatList', path, function(apiCallback) {
            apiCallback(path, null, null, -1, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateFile.RES, function(path) {
        self.dequeueApiCallback('CreateFile', path, function(apiCallback) {
            apiCallback(path, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateFile.ERR, function(path, error) {
        self.dequeueApiCallback('CreateFile', path, function(apiCallback) {
            apiCallback(path, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateDirectory.RES, function(path) {
        self.dequeueApiCallback('CreateDirectory', path, function(apiCallback) {
            apiCallback(path, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateDirectory.ERR, function(path, error) {
        self.dequeueApiCallback('CreateDirectory', path, function(apiCallback) {
            apiCallback(path, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateHardLink.RES, function(src, dst) {
        self.dequeueApiCallback('CreateHardLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateHardLink.ERR, function(src, dst, error) {
        self.dequeueApiCallback('CreateHardLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateSymbolicLink.RES, function(src, dst) {
        self.dequeueApiCallback('CreateSymbolicLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.CreateSymbolicLink.ERR, function(src, dst, error) {
        self.dequeueApiCallback('CreateSymbolicLink', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Remove.RES, function(path) {
        self.dequeueApiCallback('Remove', path, function(apiCallback) {
            apiCallback(path, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Remove.ERR, function(path, error) {
        self.dequeueApiCallback('Remove', path, function(apiCallback) {
            apiCallback(path, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Move.RES, function(src, dst) {
        self.dequeueApiCallback('Move', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Move.ERR, function(src, dst, error) {
        self.dequeueApiCallback('Move', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Copy.RES, function(src, dst) {
        self.dequeueApiCallback('Copy', src + dst, function(apiCallback) {
            apiCallback(src, dst, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Copy.ERR, function(src, dst, error) {
        self.dequeueApiCallback('Copy', src + dst, function(apiCallback) {
            apiCallback(src, dst, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Exist.RES, function(path, exist, isDir) {
        self.dequeueApiCallback('Exist', path, function(apiCallback) {
            apiCallback(path, exist, isDir, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Exist.ERR, function(path, error) {
        self.dequeueApiCallback('Exist', path, function(apiCallback) {
            apiCallback(path, false, false, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Stat.RES, function(path, stat) {
        self.dequeueApiCallback('Stat', path, function(apiCallback) {
            apiCallback(path, stat, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Stat.ERR, function(path, error) {
        self.dequeueApiCallback('Stat', path, function(apiCallback) {
            apiCallback(path, null, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Touch.RES, function(path) {
        self.dequeueApiCallback('Touch', path, function(apiCallback) {
            apiCallback(path, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Touch.ERR, function(path, error) {
        self.dequeueApiCallback('Touch', path, function(apiCallback) {
            apiCallback(path, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.ReadFile.RES, function(path, data) {
        self.dequeueApiCallback('ReadFile', path, function(apiCallback) {
            apiCallback(path, data, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.ReadFile.ERR, function(path, error) {
        self.dequeueApiCallback('ReadFile', path, function(apiCallback) {
            apiCallback(path, null, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.WriteFile.RES, function(path, progress) {
        if (progress >= 100) {
            self.dequeueApiCallback('WriteFile', path, function(apiCallback) {
                apiCallback(path, 100, null);
                return true;
            });
            /* Remove progress callback */
            self.dequeueApiCallback('WriteFileProgress', path, function(apiCallback) {
                return true;
            });
        }
        else {
            self.dequeueApiCallback('WriteFileProgress', path, function(apiCallback) {
                apiCallback(path, progress, null);
                return false;
            });
        }
    });

    this.socket.on(this.protoFS.WriteFile.ERR, function(path, error) {
        self.dequeueApiCallback('WriteFile', path, function(apiCallback) {
            apiCallback(path, 0, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.AppendFile.RES, function(path, progress) {
        if (progress >= 100) {
            self.dequeueApiCallback('AppendFile', path, function(apiCallback) {
                apiCallback(path, 100, null);
                return true;
            });
            /* Remove progress callback */
            self.dequeueApiCallback('AppendFileProgress', path, function(apiCallback) {
                apiCallback(path, progress, null);
                return true;
            });
        }
        else {
            self.dequeueApiCallback('AppendFileProgress', path, function(apiCallback) {
                apiCallback(path, progress, null);
                return false;
            });
        }
    });

    this.socket.on(this.protoFS.AppendFile.ERR, function(path, error) {
        self.dequeueApiCallback('AppendFile', path, function(apiCallback) {
            apiCallback(path, 0, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.SaveURLAs.RES, function(path) {
        self.dequeueApiCallback('SaveURLAs', path, function(apiCallback) {
            apiCallback(path, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.SaveURLAs.ERR, function(path, error) {
        self.dequeueApiCallback('SaveURLAs', path, function(apiCallback) {
            apiCallback(path, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Grep.RES, function(path, data) {
        self.dequeueApiCallback('Grep', path, function(apiCallback) {
            apiCallback(path, data, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Grep.ERR, function(path, error) {
        self.dequeueApiCallback('Grep', path, function(apiCallback) {
            apiCallback(path, null, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Open.RES, function(path, fileHandle) {
        self.dequeueApiCallback('Open', path, function(apiCallback) {
            apiCallback(path, fileHandle, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Open.ERR, function(path, error) {
        self.dequeueApiCallback('Open', path, function(apiCallback) {
            apiCallback(path, null, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.Close.RES, function(fileHandle) {
        self.dequeueApiCallback('Close', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.Close.ERR, function(fileHandle, error) {
        self.dequeueApiCallback('Close', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.ReadData.RES, function(fileHandle, data, bytesRead) {
        self.dequeueApiCallback('ReadData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, data, bytesRead, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.ReadData.ERR, function(fileHandle, error) {
        self.dequeueApiCallback('ReadData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, null, 0, error);
            return true;
        });
    });

    this.socket.on(this.protoFS.WriteData.RES, function(fileHandle, bytesWritten) {
        self.dequeueApiCallback('WriteData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, bytesWritten, null);
            return true;
        });
    });

    this.socket.on(this.protoFS.WriteData.ERR, function(fileHandle, error) {
        self.dequeueApiCallback('WriteData', fileHandle, function(apiCallback) {
            apiCallback(fileHandle, 0, error);
            return true;
        });
    });
}

FileManagerClient.prototype.detach = function() {
    /* Remove file system protocol response events */
    this.socket.removeAllListeners(this.protoFS.List.RES);
    this.socket.removeAllListeners(this.protoFS.List.ERR);
    this.socket.removeAllListeners(this.protoFS.StatList.RES);
    this.socket.removeAllListeners(this.protoFS.StatList.ERR);
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
    this.socket.removeAllListeners(this.protoFS.Stat.RES);
    this.socket.removeAllListeners(this.protoFS.Stat.ERR);
    this.socket.removeAllListeners(this.protoFS.Touch.RES);
    this.socket.removeAllListeners(this.protoFS.Touch.ERR);
    this.socket.removeAllListeners(this.protoFS.ReadFile.RES);
    this.socket.removeAllListeners(this.protoFS.ReadFile.ERR);
    this.socket.removeAllListeners(this.protoFS.WriteFile.RES);
    this.socket.removeAllListeners(this.protoFS.WriteFile.ERR);
    this.socket.removeAllListeners(this.protoFS.AppendFile.RES);
    this.socket.removeAllListeners(this.protoFS.AppendFile.ERR);
    this.socket.removeAllListeners(this.protoFS.SaveURLAs.RES);
    this.socket.removeAllListeners(this.protoFS.SaveURLAs.ERR);
    this.socket.removeAllListeners(this.protoFS.Grep.RES);
    this.socket.removeAllListeners(this.protoFS.Grep.ERR);
    this.socket.removeAllListeners(this.protoFS.Open.RES);
    this.socket.removeAllListeners(this.protoFS.Open.ERR);
    this.socket.removeAllListeners(this.protoFS.Close.RES);
    this.socket.removeAllListeners(this.protoFS.Close.ERR);
    this.socket.removeAllListeners(this.protoFS.ReadData.RES);
    this.socket.removeAllListeners(this.protoFS.ReadData.ERR);
    this.socket.removeAllListeners(this.protoFS.WriteData.RES);
    this.socket.removeAllListeners(this.protoFS.WriteData.ERR);

    this.socket = undefined;
    this.protoFS = undefined;
}

/* File system client APIs */
FileManagerClient.prototype.list = function(path, onComplete) {
    this.queueApiCallback('List', path, onComplete);
    this.socket.emit(this.protoFS.List.REQ, path);
};

FileManagerClient.prototype.iterateList = function(path, iterateFunc, finishFunc) {
    this.queueApiCallback('IterateList', path, iterateFunc);
    this.queueApiCallback('IterateListFinish', path, finishFunc);
    this.socket.emit(this.protoFS.List.REQ, path);
};

FileManagerClient.prototype.statList = function(path, onComplete) {
    this.queueApiCallback('StatList', path, onComplete);
    this.socket.emit(this.protoFS.StatList.REQ, path);
};

FileManagerClient.prototype.iterateStatList = function(path, iterateFunc, finishFunc) {
    this.queueApiCallback('IterateStatList', path, iterateFunc);
    this.queueApiCallback('IterateStatListFinish', path, finishFunc);
    this.socket.emit(this.protoFS.StatList.REQ, path);
};

FileManagerClient.prototype.createFile = function(path, onComplete) {
    this.queueApiCallback('CreateFile', path, onComplete);
    this.socket.emit(this.protoFS.CreateFile.REQ, path);
};

FileManagerClient.prototype.createDirectory = function(path, onComplete) {
    this.queueApiCallback('CreateDirectory', path, onComplete);
    this.socket.emit(this.protoFS.CreateDirectory.REQ, path);
};

FileManagerClient.prototype.createHardLink = function(src, dst, onComplete) {
    this.queueApiCallback('CreateHardLink', src + dst, onComplete);
    this.socket.emit(this.protoFS.CreateHardLink.REQ, src, dst);
};

FileManagerClient.prototype.createSymbolicLink = function(src, dst, onComplete) {
    this.queueApiCallback('CreateSymbolicLink', src + dst, onComplete);
    this.socket.emit(this.protoFS.CreateSymbolicLink.REQ, src, dst);
};

FileManagerClient.prototype.remove = function(path, onComplete) {
    this.queueApiCallback('Remove', path, onComplete);
    this.socket.emit(this.protoFS.Remove.REQ, path);
};

FileManagerClient.prototype.move = function(src, dst, onComplete) {
    this.queueApiCallback('Move', src + dst, onComplete);
    this.socket.emit(this.protoFS.Move.REQ, src, dst);
};

FileManagerClient.prototype.copy = function(src, dst, onComplete) {
    this.queueApiCallback('Copy', src + dst, onComplete);
    this.socket.emit(this.protoFS.Copy.REQ, src, dst);
};

FileManagerClient.prototype.exist = function(path, onComplete) {
    this.queueApiCallback('Exist', path, onComplete);
    this.socket.emit(this.protoFS.Exist.REQ, path);
};

FileManagerClient.prototype.stat = function(path, onComplete) {
    this.queueApiCallback('Stat', path, onComplete);
    this.socket.emit(this.protoFS.Stat.REQ, path);
};

FileManagerClient.prototype.touch = function(path, onComplete) {
    this.queueApiCallback('Touch', path, onComplete);
    var atime = new Date();
    var mtime = atime;
    this.socket.emit(this.protoFS.Touch.REQ, path, atime, mtime);
};

FileManagerClient.prototype.readFile = function(path, encoding, onComplete) {
    this.queueApiCallback('ReadFile', path, onComplete);
    this.socket.emit(this.protoFS.ReadFile.REQ, path, encoding);
};

FileManagerClient.prototype.writeFile = function(path, data, onComplete, onProgress) {
    this.queueApiCallback('WriteFile', path, onComplete);
    this.queueApiCallback('WriteFileProgress', path, onProgress);

    var blob = (data instanceof Blob) ? data : new Blob([data]);
    var blobStream = ss.createBlobReadStream(blob);

    var dataStream = ss.createStream();
    ss(this.socket).emit(this.protoFS.WriteFile.REQ, path, dataStream, blob.size);

    blobStream.pipe(dataStream);

    return { api: 'WriteFile', blobStream: blobStream, dataStream: dataStream };
};

FileManagerClient.prototype.appendFile = function(path, data, onComplete, onProgress) {
    this.queueApiCallback('AppendFile', path, onComplete);
    this.queueApiCallback('AppendFileProgress', path, onProgress);

    var blob = (data instanceof Blob) ? data : new Blob([data]);
    var blobStream = ss.createBlobReadStream(blob);

    var dataStream = ss.createStream();
    ss(this.socket).emit(this.protoFS.AppendFile.REQ, path, dataStream, blob.size);

    blobStream.pipe(dataStream);

    return { api: 'AppendFile', blobStream: blobStream, dataStream: dataStream };
};

FileManagerClient.prototype.saveUrlAs = function(path, url, onComplete) {
    this.queueApiCallback('SaveURLAs', path, onComplete);
    this.socket.emit(this.protoFS.SaveURLAs.REQ, path, url);
};

FileManagerClient.prototype.grep = function(path, regex, option, onComplete) {
    this.queueApiCallback('Grep', path, onComplete);
    this.socket.emit(this.protoFS.Grep.REQ, path, regex, option);
};

FileManagerClient.prototype.stopWriteStream = function(path, stream) {
    if (stream.api) {
        this.dequeueApiCallback(stream.api, path, function(apiCallback) {
            return true;
        });
        this.dequeueApiCallback(stream.api + 'Progress', path, function(apiCallback) {
            return true;
        });
    }

    if (stream.blobStream && stream.dataStream) {
        stream.blobStream.unpipe();
        stream.blobStream = undefined;
        stream.dataStream = undefined;
    }

    this.socket.emit(this.protoFS.Remove.REQ, path);
};

FileManagerClient.prototype.open = function(path, flag, mode, onComplete) {
    this.queueApiCallback('Open', path, onComplete);
    this.socket.emit(this.protoFS.Open.REQ, path, flag, mode);
};

FileManagerClient.prototype.close = function(fileHandle, onComplete) {
    this.queueApiCallback('Close', fileHandle, onComplete);
    this.socket.emit(this.protoFS.Close.REQ, fileHandle);
};

FileManagerClient.prototype.readData = function(fileHandle, offset, size, onComplete) {
    this.queueApiCallback('ReadData', fileHandle, onComplete);
    this.socket.emit(this.protoFS.ReadData.REQ, fileHandle, offset, size);
};

FileManagerClient.prototype.writeData = function(fileHandle, offset, size, data, onComplete) {
    this.queueApiCallback('WriteData', fileHandle, onComplete);
    this.socket.emit(this.protoFS.WriteData.REQ, fileHandle, offset, size, data);
};
