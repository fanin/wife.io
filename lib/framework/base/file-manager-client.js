var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var ss = require('socket.io-stream');
var cbq = require('./callback-queue');

var FileManagerClient = assign({}, EventEmitter.prototype, {
    /**
     * Attach File Manager API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        this.socket = _super.ioClient;
        this.APISpec = _super.apiSpec[0].FileSystem;

        /* Dispatch file system APISpec response events */
        this.socket.on(this.APISpec.List.RES, function(path, items) {
            cbq.dequeueApiCallback('List', path, function(apiCallback) {
                apiCallback(path, items, null);
                return true;
            });

            cbq.dequeueApiCallback('IterateList', path, function(apiCallback) {
                for (var i in items)
                    apiCallback(path, items[i], i, null);

                cbq.dequeueApiCallback('IterateListFinish', path, function(apiCallback) {
                    apiCallback(path);
                    return true;
                });

                return true;
            });
        });

        this.socket.on(this.APISpec.List.ERR, function(path, error) {
            cbq.dequeueApiCallback('List', path, function(apiCallback) {
                apiCallback(path, null, -1, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.StatList.RES, function(path, items, stats) {
            cbq.dequeueApiCallback('StatList', path, function(apiCallback) {
                apiCallback(path, items, stats, null);
                return true;
            });

            cbq.dequeueApiCallback('IterateStatList', path, function(apiCallback) {
                for (var i in items)
                    apiCallback(path, items[i], stats[i], i, null);
                return true;
            });

            cbq.dequeueApiCallback('IterateStatListFinish', path, function(apiCallback) {
                apiCallback(path);
                return true;
            });
        });

        this.socket.on(this.APISpec.StatList.ERR, function(path, error) {
            cbq.dequeueApiCallback('StatList', path, function(apiCallback) {
                apiCallback(path, null, null, -1, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateFile.RES, function(path) {
            cbq.dequeueApiCallback('CreateFile', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('CreateFile', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateDirectory.RES, function(path) {
            cbq.dequeueApiCallback('CreateDirectory', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateDirectory.ERR, function(path, error) {
            cbq.dequeueApiCallback('CreateDirectory', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateHardLink.RES, function(src, dst) {
            cbq.dequeueApiCallback('CreateHardLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateHardLink.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('CreateHardLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateSymbolicLink.RES, function(src, dst) {
            cbq.dequeueApiCallback('CreateSymbolicLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.CreateSymbolicLink.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('CreateSymbolicLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Remove.RES, function(path) {
            cbq.dequeueApiCallback('Remove', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Remove.ERR, function(path, error) {
            cbq.dequeueApiCallback('Remove', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Move.RES, function(src, dst) {
            cbq.dequeueApiCallback('Move', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Move.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('Move', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Copy.RES, function(src, dst) {
            cbq.dequeueApiCallback('Copy', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Copy.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('Copy', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Exist.RES, function(path, exist, isDir) {
            cbq.dequeueApiCallback('Exist', path, function(apiCallback) {
                apiCallback(path, exist, isDir, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Exist.ERR, function(path, error) {
            cbq.dequeueApiCallback('Exist', path, function(apiCallback) {
                apiCallback(path, false, false, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Stat.RES, function(path, stat) {
            cbq.dequeueApiCallback('Stat', path, function(apiCallback) {
                apiCallback(path, stat, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Stat.ERR, function(path, error) {
            cbq.dequeueApiCallback('Stat', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Touch.RES, function(path) {
            cbq.dequeueApiCallback('Touch', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Touch.ERR, function(path, error) {
            cbq.dequeueApiCallback('Touch', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.ReadFile.RES, function(path, data) {
            cbq.dequeueApiCallback('ReadFile', path, function(apiCallback) {
                apiCallback(path, data, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.ReadFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('ReadFile', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.WriteFile.RES, function(path, progress) {
            if (progress >= 100) {
                cbq.dequeueApiCallback('WriteFile', path, function(apiCallback) {
                    apiCallback(path, 100, null);
                    return true;
                });
                /* Remove progress callback */
                cbq.dequeueApiCallback('WriteFileProgress', path, function(apiCallback) {
                    return true;
                });
            }
            else {
                cbq.dequeueApiCallback('WriteFileProgress', path, function(apiCallback) {
                    apiCallback(path, progress, null);
                    return false;
                });
            }
        });

        this.socket.on(this.APISpec.WriteFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('WriteFile', path, function(apiCallback) {
                apiCallback(path, 0, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.AppendFile.RES, function(path, progress) {
            if (progress >= 100) {
                cbq.dequeueApiCallback('AppendFile', path, function(apiCallback) {
                    apiCallback(path, 100, null);
                    return true;
                });
                /* Remove progress callback */
                cbq.dequeueApiCallback('AppendFileProgress', path, function(apiCallback) {
                    apiCallback(path, progress, null);
                    return true;
                });
            }
            else {
                cbq.dequeueApiCallback('AppendFileProgress', path, function(apiCallback) {
                    apiCallback(path, progress, null);
                    return false;
                });
            }
        });

        this.socket.on(this.APISpec.AppendFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('AppendFile', path, function(apiCallback) {
                apiCallback(path, 0, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.SaveURLAs.RES, function(path) {
            cbq.dequeueApiCallback('SaveURLAs', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.SaveURLAs.ERR, function(path, error) {
            cbq.dequeueApiCallback('SaveURLAs', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Grep.RES, function(path, data) {
            cbq.dequeueApiCallback('Grep', path, function(apiCallback) {
                apiCallback(path, data, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Grep.ERR, function(path, error) {
            cbq.dequeueApiCallback('Grep', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Open.RES, function(path, fileHandle) {
            cbq.dequeueApiCallback('Open', path, function(apiCallback) {
                apiCallback(path, fileHandle, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Open.ERR, function(path, error) {
            cbq.dequeueApiCallback('Open', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.Close.RES, function(fileHandle) {
            cbq.dequeueApiCallback('Close', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.Close.ERR, function(fileHandle, error) {
            cbq.dequeueApiCallback('Close', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.ReadData.RES, function(fileHandle, data, bytesRead) {
            cbq.dequeueApiCallback('ReadData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, data, bytesRead, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.ReadData.ERR, function(fileHandle, error) {
            cbq.dequeueApiCallback('ReadData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, null, 0, error);
                return true;
            });
        });

        this.socket.on(this.APISpec.WriteData.RES, function(fileHandle, bytesWritten) {
            cbq.dequeueApiCallback('WriteData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, bytesWritten, null);
                return true;
            });
        });

        this.socket.on(this.APISpec.WriteData.ERR, function(fileHandle, error) {
            cbq.dequeueApiCallback('WriteData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, 0, error);
                return true;
            });
        });
    },

    /**
     * Detach File Manager API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.APISpec.List.RES);
        this.socket.removeAllListeners(this.APISpec.List.ERR);
        this.socket.removeAllListeners(this.APISpec.StatList.RES);
        this.socket.removeAllListeners(this.APISpec.StatList.ERR);
        this.socket.removeAllListeners(this.APISpec.CreateFile.RES);
        this.socket.removeAllListeners(this.APISpec.CreateFile.ERR);
        this.socket.removeAllListeners(this.APISpec.CreateDirectory.RES);
        this.socket.removeAllListeners(this.APISpec.CreateDirectory.ERR);
        this.socket.removeAllListeners(this.APISpec.CreateHardLink.RES);
        this.socket.removeAllListeners(this.APISpec.CreateHardLink.ERR);
        this.socket.removeAllListeners(this.APISpec.CreateSymbolicLink.RES);
        this.socket.removeAllListeners(this.APISpec.CreateSymbolicLink.ERR);
        this.socket.removeAllListeners(this.APISpec.Remove.RES);
        this.socket.removeAllListeners(this.APISpec.Remove.ERR);
        this.socket.removeAllListeners(this.APISpec.Move.RES);
        this.socket.removeAllListeners(this.APISpec.Move.ERR);
        this.socket.removeAllListeners(this.APISpec.Copy.RES);
        this.socket.removeAllListeners(this.APISpec.Copy.ERR);
        this.socket.removeAllListeners(this.APISpec.Exist.RES);
        this.socket.removeAllListeners(this.APISpec.Exist.ERR);
        this.socket.removeAllListeners(this.APISpec.Stat.RES);
        this.socket.removeAllListeners(this.APISpec.Stat.ERR);
        this.socket.removeAllListeners(this.APISpec.Touch.RES);
        this.socket.removeAllListeners(this.APISpec.Touch.ERR);
        this.socket.removeAllListeners(this.APISpec.ReadFile.RES);
        this.socket.removeAllListeners(this.APISpec.ReadFile.ERR);
        this.socket.removeAllListeners(this.APISpec.WriteFile.RES);
        this.socket.removeAllListeners(this.APISpec.WriteFile.ERR);
        this.socket.removeAllListeners(this.APISpec.AppendFile.RES);
        this.socket.removeAllListeners(this.APISpec.AppendFile.ERR);
        this.socket.removeAllListeners(this.APISpec.SaveURLAs.RES);
        this.socket.removeAllListeners(this.APISpec.SaveURLAs.ERR);
        this.socket.removeAllListeners(this.APISpec.Grep.RES);
        this.socket.removeAllListeners(this.APISpec.Grep.ERR);
        this.socket.removeAllListeners(this.APISpec.Open.RES);
        this.socket.removeAllListeners(this.APISpec.Open.ERR);
        this.socket.removeAllListeners(this.APISpec.Close.RES);
        this.socket.removeAllListeners(this.APISpec.Close.ERR);
        this.socket.removeAllListeners(this.APISpec.ReadData.RES);
        this.socket.removeAllListeners(this.APISpec.ReadData.ERR);
        this.socket.removeAllListeners(this.APISpec.WriteData.RES);
        this.socket.removeAllListeners(this.APISpec.WriteData.ERR);

        this.socket = undefined;
        this.APISpec = undefined;
    },

    list: function(path, onComplete) {
        cbq.queueApiCallback('List', path, onComplete);
        this.socket.emit(this.APISpec.List.REQ, path);
    },

    iterateList: function(path, iterateFunc, finishFunc) {
        cbq.queueApiCallback('IterateList', path, iterateFunc);
        cbq.queueApiCallback('IterateListFinish', path, finishFunc);
        this.socket.emit(this.APISpec.List.REQ, path);
    },

    statList: function(path, onComplete) {
        cbq.queueApiCallback('StatList', path, onComplete);
        this.socket.emit(this.APISpec.StatList.REQ, path);
    },

    iterateStatList: function(path, iterateFunc, finishFunc) {
        cbq.queueApiCallback('IterateStatList', path, iterateFunc);
        cbq.queueApiCallback('IterateStatListFinish', path, finishFunc);
        this.socket.emit(this.APISpec.StatList.REQ, path);
    },

    createFile: function(path, onComplete) {
        cbq.queueApiCallback('CreateFile', path, onComplete);
        this.socket.emit(this.APISpec.CreateFile.REQ, path);
    },

    createDirectory: function(path, onComplete) {
        cbq.queueApiCallback('CreateDirectory', path, onComplete);
        this.socket.emit(this.APISpec.CreateDirectory.REQ, path);
    },

    createHardLink: function(src, dst, onComplete) {
        cbq.queueApiCallback('CreateHardLink', src + dst, onComplete);
        this.socket.emit(this.APISpec.CreateHardLink.REQ, src, dst);
    },

    createSymbolicLink: function(src, dst, onComplete) {
        cbq.queueApiCallback('CreateSymbolicLink', src + dst, onComplete);
        this.socket.emit(this.APISpec.CreateSymbolicLink.REQ, src, dst);
    },

    remove: function(path, onComplete) {
        cbq.queueApiCallback('Remove', path, onComplete);
        this.socket.emit(this.APISpec.Remove.REQ, path);
    },

    move: function(src, dst, onComplete) {
        cbq.queueApiCallback('Move', src + dst, onComplete);
        this.socket.emit(this.APISpec.Move.REQ, src, dst);
    },

    copy: function(src, dst, onComplete) {
        cbq.queueApiCallback('Copy', src + dst, onComplete);
        this.socket.emit(this.APISpec.Copy.REQ, src, dst);
    },

    exist: function(path, onComplete) {
        cbq.queueApiCallback('Exist', path, onComplete);
        this.socket.emit(this.APISpec.Exist.REQ, path);
    },

    stat: function(path, onComplete) {
        cbq.queueApiCallback('Stat', path, onComplete);
        this.socket.emit(this.APISpec.Stat.REQ, path);
    },

    touch: function(path, onComplete) {
        cbq.queueApiCallback('Touch', path, onComplete);
        var atime = new Date();
        var mtime = atime;
        this.socket.emit(this.APISpec.Touch.REQ, path, atime, mtime);
    },

    readFile: function(path, encoding, onComplete) {
        cbq.queueApiCallback('ReadFile', path, onComplete);
        this.socket.emit(this.APISpec.ReadFile.REQ, path, encoding);
    },

    writeFile: function(path, data, onComplete, onProgress) {
        cbq.queueApiCallback('WriteFile', path, onComplete);
        cbq.queueApiCallback('WriteFileProgress', path, onProgress);

        var blob = (data instanceof Blob) ? data : new Blob([data]);
        var blobStream = ss.createBlobReadStream(blob);

        var dataStream = ss.createStream();
        ss(this.socket).emit(this.APISpec.WriteFile.REQ, path, dataStream, blob.size);

        blobStream.pipe(dataStream);

        return { api: 'WriteFile', blobStream: blobStream, dataStream: dataStream };
    },

    appendFile: function(path, data, onComplete, onProgress) {
        cbq.queueApiCallback('AppendFile', path, onComplete);
        cbq.queueApiCallback('AppendFileProgress', path, onProgress);

        var blob = (data instanceof Blob) ? data : new Blob([data]);
        var blobStream = ss.createBlobReadStream(blob);

        var dataStream = ss.createStream();
        ss(this.socket).emit(this.APISpec.AppendFile.REQ, path, dataStream, blob.size);

        blobStream.pipe(dataStream);

        return { api: 'AppendFile', blobStream: blobStream, dataStream: dataStream };
    },

    saveUrlAs: function(path, url, onComplete) {
        cbq.queueApiCallback('SaveURLAs', path, onComplete);
        this.socket.emit(this.APISpec.SaveURLAs.REQ, path, url);
    },

    grep: function(path, regex, option, onComplete) {
        cbq.queueApiCallback('Grep', path, onComplete);
        this.socket.emit(this.APISpec.Grep.REQ, path, regex, option);
    },

    stopWriteStream: function(path, stream) {
        if (stream.api) {
            cbq.dequeueApiCallback(stream.api, path, function(apiCallback) {
                return true;
            });
            cbq.dequeueApiCallback(stream.api + 'Progress', path, function(apiCallback) {
                return true;
            });
        }

        if (stream.blobStream && stream.dataStream) {
            stream.blobStream.unpipe();
            stream.blobStream = undefined;
            stream.dataStream = undefined;
        }

        this.socket.emit(this.APISpec.Remove.REQ, path);
    },

    open: function(path, flag, mode, onComplete) {
        cbq.queueApiCallback('Open', path, onComplete);
        this.socket.emit(this.APISpec.Open.REQ, path, flag, mode);
    },

    close: function(fileHandle, onComplete) {
        cbq.queueApiCallback('Close', fileHandle, onComplete);
        this.socket.emit(this.APISpec.Close.REQ, fileHandle);
    },

    readData: function(fileHandle, offset, size, onComplete) {
        cbq.queueApiCallback('ReadData', fileHandle, onComplete);
        this.socket.emit(this.APISpec.ReadData.REQ, fileHandle, offset, size);
    },

    writeData: function(fileHandle, offset, size, data, onComplete) {
        cbq.queueApiCallback('WriteData', fileHandle, onComplete);
        this.socket.emit(this.APISpec.WriteData.REQ, fileHandle, offset, size, data);
    }
});

module.exports = FileManagerClient;
