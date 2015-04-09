var EventEmitter = require('events').EventEmitter;
var assign       = require('object-assign');
var ss           = require('socket.io-stream');
var cbq          = require('./callback-queue');

var FileManager = assign({}, EventEmitter.prototype, {
    /**
     * Attach File Manager API response handler to DiligentClient
     * @param {object} DiligentClient object
     */
    attach: function(_super) {
        this.socket = _super.ioClient;
        this.wsapi = _super.wsapi[0].FileSystem;

        /* Dispatch file system wsapi response events */
        this.socket.on(this.wsapi.List.RES, function(path, items) {
            cbq.dequeueApiCallback('fs.list', path, function(apiCallback) {
                apiCallback(path, items, null);
                return true;
            });

            cbq.dequeueApiCallback('fs.iterateList', path, function(apiCallback) {
                for (var i in items)
                    apiCallback(path, items[i], i, null);

                cbq.dequeueApiCallback('fs.iterateListFinish', path, function(apiCallback) {
                    apiCallback(path);
                    return true;
                });

                return true;
            });
        });

        this.socket.on(this.wsapi.List.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.list', path, function(apiCallback) {
                apiCallback(path, null, -1, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.StatList.RES, function(path, items, stats) {
            cbq.dequeueApiCallback('fs.statList', path, function(apiCallback) {
                apiCallback(path, items, stats, null);
                return true;
            });

            cbq.dequeueApiCallback('fs.iterateStatList', path, function(apiCallback) {
                for (var i in items)
                    apiCallback(path, items[i], stats[i], i, null);
                return true;
            });

            cbq.dequeueApiCallback('fs.iterateStatListFinish', path, function(apiCallback) {
                apiCallback(path);
                return true;
            });
        });

        this.socket.on(this.wsapi.StatList.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.statList', path, function(apiCallback) {
                apiCallback(path, null, null, -1, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateFile.RES, function(path) {
            cbq.dequeueApiCallback('fs.createFile', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.createFile', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateDirectory.RES, function(path) {
            cbq.dequeueApiCallback('fs.createDirectory', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateDirectory.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.createDirectory', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateHardLink.RES, function(src, dst) {
            cbq.dequeueApiCallback('fs.createHardLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateHardLink.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('fs.createHardLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateSymbolicLink.RES, function(src, dst) {
            cbq.dequeueApiCallback('fs.createSymbolicLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.CreateSymbolicLink.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('fs.createSymbolicLink', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Remove.RES, function(path) {
            cbq.dequeueApiCallback('fs.remove', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Remove.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.remove', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Move.RES, function(src, dst) {
            cbq.dequeueApiCallback('fs.move', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Move.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('fs.move', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Copy.RES, function(src, dst) {
            cbq.dequeueApiCallback('fs.copy', src + dst, function(apiCallback) {
                apiCallback(src, dst, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Copy.ERR, function(src, dst, error) {
            cbq.dequeueApiCallback('fs.copy', src + dst, function(apiCallback) {
                apiCallback(src, dst, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Exist.RES, function(path, exist, isDir) {
            cbq.dequeueApiCallback('fs.exist', path, function(apiCallback) {
                apiCallback(path, exist, isDir, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Exist.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.exist', path, function(apiCallback) {
                apiCallback(path, false, false, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Stat.RES, function(path, stat) {
            cbq.dequeueApiCallback('fs.stat', path, function(apiCallback) {
                apiCallback(path, stat, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Stat.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.stat', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Touch.RES, function(path) {
            cbq.dequeueApiCallback('fs.touch', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Touch.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.touch', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.ReadFile.RES, function(path, data) {
            cbq.dequeueApiCallback('fs.readFile', path, function(apiCallback) {
                apiCallback(path, data, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.ReadFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.readFile', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.WriteFile.RES, function(path, progress) {
            if (progress >= 100) {
                cbq.dequeueApiCallback('fs.writeFile', path, function(apiCallback) {
                    apiCallback(path, 100, null);
                    return true;
                });
                /* Remove progress callback */
                cbq.dequeueApiCallback('fs.writeFileProgress', path, function(apiCallback) {
                    return true;
                });
            }
            else {
                cbq.dequeueApiCallback('fs.writeFileProgress', path, function(apiCallback) {
                    apiCallback(path, progress, null);
                    return false;
                });
            }
        });

        this.socket.on(this.wsapi.WriteFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.writeFile', path, function(apiCallback) {
                apiCallback(path, 0, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.AppendFile.RES, function(path, progress) {
            if (progress >= 100) {
                cbq.dequeueApiCallback('fs.appendFile', path, function(apiCallback) {
                    apiCallback(path, 100, null);
                    return true;
                });
                /* Remove progress callback */
                cbq.dequeueApiCallback('fs.appendFileProgress', path, function(apiCallback) {
                    apiCallback(path, progress, null);
                    return true;
                });
            }
            else {
                cbq.dequeueApiCallback('fs.appendFileProgress', path, function(apiCallback) {
                    apiCallback(path, progress, null);
                    return false;
                });
            }
        });

        this.socket.on(this.wsapi.AppendFile.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.appendFile', path, function(apiCallback) {
                apiCallback(path, 0, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.SaveURLAs.RES, function(path) {
            cbq.dequeueApiCallback('fs.saveUrlAs', path, function(apiCallback) {
                apiCallback(path, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.SaveURLAs.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.saveUrlAs', path, function(apiCallback) {
                apiCallback(path, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Grep.RES, function(path, data) {
            cbq.dequeueApiCallback('fs.grep', path, function(apiCallback) {
                apiCallback(path, data, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Grep.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.grep', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Open.RES, function(path, fileHandle) {
            cbq.dequeueApiCallback('fs.open', path, function(apiCallback) {
                apiCallback(path, fileHandle, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Open.ERR, function(path, error) {
            cbq.dequeueApiCallback('fs.open', path, function(apiCallback) {
                apiCallback(path, null, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.Close.RES, function(fileHandle) {
            cbq.dequeueApiCallback('fs.close', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.Close.ERR, function(fileHandle, error) {
            cbq.dequeueApiCallback('fs.close', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.ReadData.RES, function(fileHandle, data, bytesRead) {
            cbq.dequeueApiCallback('fs.readData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, data, bytesRead, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.ReadData.ERR, function(fileHandle, error) {
            cbq.dequeueApiCallback('fs.readData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, null, 0, error);
                return true;
            });
        });

        this.socket.on(this.wsapi.WriteData.RES, function(fileHandle, bytesWritten) {
            cbq.dequeueApiCallback('fs.writeData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, bytesWritten, null);
                return true;
            });
        });

        this.socket.on(this.wsapi.WriteData.ERR, function(fileHandle, error) {
            cbq.dequeueApiCallback('fs.writeData', fileHandle, function(apiCallback) {
                apiCallback(fileHandle, 0, error);
                return true;
            });
        });
    },

    /**
     * Detach File Manager API response handler from DiligentClient
     */
    detach: function() {
        this.socket.removeAllListeners(this.wsapi.List.RES);
        this.socket.removeAllListeners(this.wsapi.List.ERR);
        this.socket.removeAllListeners(this.wsapi.StatList.RES);
        this.socket.removeAllListeners(this.wsapi.StatList.ERR);
        this.socket.removeAllListeners(this.wsapi.CreateFile.RES);
        this.socket.removeAllListeners(this.wsapi.CreateFile.ERR);
        this.socket.removeAllListeners(this.wsapi.CreateDirectory.RES);
        this.socket.removeAllListeners(this.wsapi.CreateDirectory.ERR);
        this.socket.removeAllListeners(this.wsapi.CreateHardLink.RES);
        this.socket.removeAllListeners(this.wsapi.CreateHardLink.ERR);
        this.socket.removeAllListeners(this.wsapi.CreateSymbolicLink.RES);
        this.socket.removeAllListeners(this.wsapi.CreateSymbolicLink.ERR);
        this.socket.removeAllListeners(this.wsapi.Remove.RES);
        this.socket.removeAllListeners(this.wsapi.Remove.ERR);
        this.socket.removeAllListeners(this.wsapi.Move.RES);
        this.socket.removeAllListeners(this.wsapi.Move.ERR);
        this.socket.removeAllListeners(this.wsapi.Copy.RES);
        this.socket.removeAllListeners(this.wsapi.Copy.ERR);
        this.socket.removeAllListeners(this.wsapi.Exist.RES);
        this.socket.removeAllListeners(this.wsapi.Exist.ERR);
        this.socket.removeAllListeners(this.wsapi.Stat.RES);
        this.socket.removeAllListeners(this.wsapi.Stat.ERR);
        this.socket.removeAllListeners(this.wsapi.Touch.RES);
        this.socket.removeAllListeners(this.wsapi.Touch.ERR);
        this.socket.removeAllListeners(this.wsapi.ReadFile.RES);
        this.socket.removeAllListeners(this.wsapi.ReadFile.ERR);
        this.socket.removeAllListeners(this.wsapi.WriteFile.RES);
        this.socket.removeAllListeners(this.wsapi.WriteFile.ERR);
        this.socket.removeAllListeners(this.wsapi.AppendFile.RES);
        this.socket.removeAllListeners(this.wsapi.AppendFile.ERR);
        this.socket.removeAllListeners(this.wsapi.SaveURLAs.RES);
        this.socket.removeAllListeners(this.wsapi.SaveURLAs.ERR);
        this.socket.removeAllListeners(this.wsapi.Grep.RES);
        this.socket.removeAllListeners(this.wsapi.Grep.ERR);
        this.socket.removeAllListeners(this.wsapi.Open.RES);
        this.socket.removeAllListeners(this.wsapi.Open.ERR);
        this.socket.removeAllListeners(this.wsapi.Close.RES);
        this.socket.removeAllListeners(this.wsapi.Close.ERR);
        this.socket.removeAllListeners(this.wsapi.ReadData.RES);
        this.socket.removeAllListeners(this.wsapi.ReadData.ERR);
        this.socket.removeAllListeners(this.wsapi.WriteData.RES);
        this.socket.removeAllListeners(this.wsapi.WriteData.ERR);

        this.socket = undefined;
        this.wsapi = undefined;
    },

    list: function(path, onComplete) {
        cbq.queueApiCallback('fs.list', path, onComplete);
        this.socket.emit(this.wsapi.List.REQ, path);
    },

    iterateList: function(path, iterateFunc, finishFunc) {
        cbq.queueApiCallback('fs.iterateList', path, iterateFunc);
        cbq.queueApiCallback('fs.iterateListFinish', path, finishFunc);
        this.socket.emit(this.wsapi.List.REQ, path);
    },

    statList: function(path, onComplete) {
        cbq.queueApiCallback('fs.statList', path, onComplete);
        this.socket.emit(this.wsapi.StatList.REQ, path);
    },

    iterateStatList: function(path, iterateFunc, finishFunc) {
        cbq.queueApiCallback('fs.iterateStatList', path, iterateFunc);
        cbq.queueApiCallback('fs.iterateStatListFinish', path, finishFunc);
        this.socket.emit(this.wsapi.StatList.REQ, path);
    },

    createFile: function(path, onComplete) {
        cbq.queueApiCallback('fs.createFile', path, onComplete);
        this.socket.emit(this.wsapi.CreateFile.REQ, path);
    },

    createDirectory: function(path, onComplete) {
        cbq.queueApiCallback('fs.createDirectory', path, onComplete);
        this.socket.emit(this.wsapi.CreateDirectory.REQ, path);
    },

    createHardLink: function(src, dst, onComplete) {
        cbq.queueApiCallback('fs.createHardLink', src + dst, onComplete);
        this.socket.emit(this.wsapi.CreateHardLink.REQ, src, dst);
    },

    createSymbolicLink: function(src, dst, onComplete) {
        cbq.queueApiCallback('fs.createSymbolicLink', src + dst, onComplete);
        this.socket.emit(this.wsapi.CreateSymbolicLink.REQ, src, dst);
    },

    remove: function(path, onComplete) {
        cbq.queueApiCallback('fs.remove', path, onComplete);
        this.socket.emit(this.wsapi.Remove.REQ, path);
    },

    move: function(src, dst, onComplete) {
        cbq.queueApiCallback('fs.move', src + dst, onComplete);
        this.socket.emit(this.wsapi.Move.REQ, src, dst);
    },

    copy: function(src, dst, onComplete) {
        cbq.queueApiCallback('fs.copy', src + dst, onComplete);
        this.socket.emit(this.wsapi.Copy.REQ, src, dst);
    },

    exist: function(path, onComplete) {
        cbq.queueApiCallback('fs.exist', path, onComplete);
        this.socket.emit(this.wsapi.Exist.REQ, path);
    },

    stat: function(path, onComplete) {
        cbq.queueApiCallback('fs.stat', path, onComplete);
        this.socket.emit(this.wsapi.Stat.REQ, path);
    },

    touch: function(path, onComplete) {
        cbq.queueApiCallback('fs.touch', path, onComplete);
        var atime = new Date();
        var mtime = atime;
        this.socket.emit(this.wsapi.Touch.REQ, path, atime, mtime);
    },

    readFile: function(path, encoding, onComplete) {
        cbq.queueApiCallback('fs.readFile', path, onComplete);
        this.socket.emit(this.wsapi.ReadFile.REQ, path, encoding);
    },

    writeFile: function(path, data, onComplete, onProgress) {
        cbq.queueApiCallback('fs.writeFile', path, onComplete);
        cbq.queueApiCallback('fs.writeFileProgress', path, onProgress);

        var blob = (data instanceof Blob) ? data : new Blob([data]);
        var blobStream = ss.createBlobReadStream(blob);

        var dataStream = ss.createStream();
        ss(this.socket).emit(this.wsapi.WriteFile.REQ, path, dataStream, blob.size);

        blobStream.pipe(dataStream);

        return { api: 'fs.writeFile', blobStream: blobStream, dataStream: dataStream };
    },

    appendFile: function(path, data, onComplete, onProgress) {
        cbq.queueApiCallback('fs.appendFile', path, onComplete);
        cbq.queueApiCallback('fs.appendFileProgress', path, onProgress);

        var blob = (data instanceof Blob) ? data : new Blob([data]);
        var blobStream = ss.createBlobReadStream(blob);

        var dataStream = ss.createStream();
        ss(this.socket).emit(this.wsapi.AppendFile.REQ, path, dataStream, blob.size);

        blobStream.pipe(dataStream);

        return { api: 'fs.appendFile', blobStream: blobStream, dataStream: dataStream };
    },

    saveUrlAs: function(path, url, onComplete) {
        cbq.queueApiCallback('fs.saveUrlAs', path, onComplete);
        this.socket.emit(this.wsapi.SaveURLAs.REQ, path, url);
    },

    grep: function(path, regex, option, onComplete) {
        cbq.queueApiCallback('fs.grep', path, onComplete);
        this.socket.emit(this.wsapi.Grep.REQ, path, regex, option);
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

        this.socket.emit(this.wsapi.Remove.REQ, path);
    },

    open: function(path, flag, mode, onComplete) {
        cbq.queueApiCallback('fs.open', path, onComplete);
        this.socket.emit(this.wsapi.Open.REQ, path, flag, mode);
    },

    close: function(fileHandle, onComplete) {
        cbq.queueApiCallback('fs.close', fileHandle, onComplete);
        this.socket.emit(this.wsapi.Close.REQ, fileHandle);
    },

    readData: function(fileHandle, offset, size, onComplete) {
        cbq.queueApiCallback('fs.readData', fileHandle, onComplete);
        this.socket.emit(this.wsapi.ReadData.REQ, fileHandle, offset, size);
    },

    writeData: function(fileHandle, offset, size, data, onComplete) {
        cbq.queueApiCallback('fs.writeData', fileHandle, onComplete);
        this.socket.emit(this.wsapi.WriteData.REQ, fileHandle, offset, size, data);
    }
});

module.exports = FileManager;
