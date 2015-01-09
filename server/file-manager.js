var fs = require('graceful-fs'),
    fse = require('fs-extra'),
    path = require('path'),
    ss = require('socket.io-stream'),
    url = require('url'),
    http = require('http'),
    child_process = require('child_process'),
    ReadWriteLock = require('rwlock'),
    htmlToText = require('html-to-text');

var SYSTEM = require('../system');
var rwlock = new ReadWriteLock();

module.exports = FileManager;

function FileManager(_super, apiSpec) {
    this._super = _super;
    this.APISpec = apiSpec;
    this.storageManager = _super.storageManager;
}

FileManager.prototype.register = function(socket, complete) {
    var self = this;

    function resolvePath(_path, appName) {
        return self.storageManager.getUserDataPath(socket, _path);
    }

    /**
     * Protocol Listener: File System Events
     */
    socket.on(self.APISpec.List.REQ, function(path) {
        try {
            var realPath = resolvePath(path);

            if (SYSTEM.ERROR.HasError(realPath))
                socket.emit(self.APISpec.List.ERR, path, realPath);
            else {
                var items = fs.readdirSync(realPath);
                socket.emit(self.APISpec.List.RES, path, items);
            }
        }
        catch (err) {
            socket.emit(self.APISpec.List.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(self.APISpec.StatList.REQ, function(_path) {
        try {
            var realPath = resolvePath(_path);

            if (SYSTEM.ERROR.HasError(realPath))
                socket.emit(self.APISpec.StatList.ERR, _path, realPath);
            else {
                var items = fs.readdirSync(realPath);
                var itemStats = [];
                items.forEach(function(file) {
                    var stat = fs.lstatSync(realPath + path.sep + file);
                    itemStats.push(stat);
                });
                socket.emit(self.APISpec.StatList.RES, _path, items, itemStats);
            }
        }
        catch (err) {
            socket.emit(self.APISpec.StatList.ERR, _path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(self.APISpec.CreateFile.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.CreateFile.ERR, path, realPath);
        else {
            fs.createFile(realPath, function(err) {
                if (err) {
                    socket.emit(self.APISpec.CreateFile.ERR, path, SYSTEM.ERROR.FSIOError);
                }
                else {
                    socket.emit(self.APISpec.CreateFile.RES, path);
                }
            });
        }
    });

    socket.on(self.APISpec.CreateDirectory.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.CreateDirectory.ERR, path, realPath);
        else {
            fse.mkdirp(realPath, function(err) {
                if (err) {
                    socket.emit(self.APISpec.CreateDirectory.ERR, path, SYSTEM.ERROR.FSIOError);
                }
                else {
                    socket.emit(self.APISpec.CreateDirectory.RES, path);
                }
            });
        }
    });

    socket.on(self.APISpec.CreateHardLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(self.APISpec.CreateHardLink.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(self.APISpec.CreateHardLink.ERR, srcPath, dstPath, realDstPath);
        else {
            if (!fs.existsSync(realSrcPath))
                socket.emit(self.APISpec.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
            else if (!fs.linkSync(realSrcPath, realDstPath))
                socket.emit(self.APISpec.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
            else
                socket.emit(self.APISpec.CreateHardLink.RES, srcPath, dstPath);
        }
    });

    socket.on(self.APISpec.CreateSymbolicLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(self.APISpec.CreateSymbolicLink.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(self.APISpec.CreateSymbolicLink.ERR, srcPath, dstPath, realDstPath);
        else {
            if (!fs.existsSync(realSrcPath))
                socket.emit(self.APISpec.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
            else if (!fs.symlinkSync(realSrcPath, realDstPath))
                socket.emit(self.APISpec.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
            else
                socket.emit(self.APISpec.CreateSymbolicLink.RES, srcPath, dstPath);
        }
    });

    socket.on(self.APISpec.Remove.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.Remove.ERR, path, realPath);
        else {
            if (fs.existsSync(realPath)) {
                fse.remove(realPath, function(err) {
                    if (err) {
                        socket.emit(self.APISpec.Remove.ERR, path, SYSTEM.ERROR.FSIOError);
                    }
                    else
                        socket.emit(self.APISpec.Remove.RES, path);
                });
            }
            else
                socket.emit(self.APISpec.Remove.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(self.APISpec.Move.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(self.APISpec.Move.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(self.APISpec.Move.ERR, srcPath, dstPath, realDstPath);
        else {
            if (fs.existsSync(realSrcPath)) {
                fse.move(realSrcPath, realDstPath, function(err) {
                    if (err) {
                        socket.emit(self.APISpec.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
                    }
                    else
                        socket.emit(self.APISpec.Move.RES, srcPath, dstPath);
                });
            }
            else
                socket.emit(self.APISpec.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(self.APISpec.Copy.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(self.APISpec.Copy.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(self.APISpec.Copy.ERR, srcPath, dstPath, realDstPath);
        else {
            if (fs.existsSync(realSrcPath)) {
                fse.copy(realSrcPath, realDstPath, function(err) {
                    if (err) {
                        socket.emit(self.APISpec.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
                    }
                    else
                        socket.emit(self.APISpec.Copy.RES, srcPath, dstPath);
                });
            }
            else
                socket.emit(self.APISpec.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(self.APISpec.Exist.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.Exist.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            var isDir = exist ? fs.lstatSync(realPath).isDirectory() : false;
            socket.emit(self.APISpec.Exist.RES, path, exist, isDir);
        }
    });

    socket.on(self.APISpec.Stat.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.Stat.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            if (exist) {
                var stat = fs.lstatSync(realPath);
                socket.emit(self.APISpec.Stat.RES, path, stat);
            }
            else
                socket.emit(self.APISpec.Stat.ERR, path, SYSTEM.ERROR.FSIOError);
        }
    });

    socket.on(self.APISpec.Touch.REQ, function(path, atime, mtime) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.Touch.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            if (exist) {
                fs.utimesSync(realPath, new Date(atime), new Date(mtime));
                socket.emit(self.APISpec.Touch.RES, path);
            }
            else
                socket.emit(self.APISpec.Touch.ERR, path, SYSTEM.ERROR.FSIOError);
        }
    });

    socket.on(self.APISpec.ReadFile.REQ, function(path, encoding) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.ReadFile.ERR, path, realPath);
        else {
            encoding = encoding || 'utf8';

            if (fs.existsSync(realPath)) {
                /*
                var readStream = fs.createReadStream(path);
                readStream.on('open', function () {
                    var dataStream = ss.createStream();
                    ss(socket).emit(self.APISpec.ReadFile.RES, path, dataStream);
                    readStream.pipe(dataStream);
                });

                readStream.on('error', function(err) {
                    socket.emit(self.APISpec.ReadFile.ERR, path, SYSTEM.ERROR.FSIOError);
                });
                */

                fs.readFile(realPath, encoding, function(err, data) {
                    if (err) {
                        socket.emit(self.APISpec.ReadFile.ERR, path, SYSTEM.ERROR.FSIOError);
                    }
                    else {
                        socket.emit(self.APISpec.ReadFile.RES, path, data);
                    }
                });

            }
            else
                socket.emit(self.APISpec.ReadFile.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    ss(socket).on(self.APISpec.WriteFile.REQ, function(path, dataStream, dataSize) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.WriteFile.ERR, path, realPath);
        else {
            var writeStream = fs.createWriteStream(realPath);
            var size = 0;
            var currentProgress = -1;

            rwlock.writeLock(realPath, function(release) {
                dataStream.on('data', function(chunk) {
                    size += chunk.length;
                    /* Normalize progress value to 0~99 */
                    var progress = Math.floor(size / dataSize * 100);
                    progress = (progress > 0) ? progress - 1: 0;
                    if (currentProgress === progress) return;
                    currentProgress = progress;
                    socket.emit(self.APISpec.WriteFile.RES, path, progress);
                });

                dataStream.on('finish', function() {
                    socket.emit(self.APISpec.WriteFile.RES, path, 100);
                    dataStream.end();
                    release();
                });

                dataStream.on('error', function(err) {
                    if (err) {
                        socket.emit(self.APISpec.WriteFile.ERR, path, SYSTEM.ERROR.FSIOError);
                        release();
                    }
                });

                dataStream.pipe(writeStream);
            });
        }
    });

    ss(socket).on(self.APISpec.AppendFile.REQ, function(path, dataStream, dataSize) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.AppendFile.ERR, path, realPath);
        else {
            rwlock.writeLock(realPath, function(release) {
                if (fs.existsSync(realPath)) {
                    var writeStream = fs.createWriteStream(realPath, {'flags': 'a'});
                    var size = 0;
                    var currentProgress = -1;

                    dataStream.on('data', function(chunk) {
                        size += chunk.length;
                        /* Normalize progress value to 0~99 */
                        var progress = Math.floor(size / dataSize * 100);
                        progress = (progress > 0) ? progress - 1: 0;
                        if (currentProgress === progress) return;
                        currentProgress = progress;
                        socket.emit(self.APISpec.AppendFile.RES, path, progress);
                    });

                    dataStream.on('finish', function() {
                        socket.emit(self.APISpec.AppendFile.RES, path, 100);
                        dataStream.end();
                        release();
                    });

                    dataStream.on('error', function(err) {
                        if (err) {
                            socket.emit(self.APISpec.AppendFile.ERR, path, SYSTEM.ERROR.FSIOError);
                            release();
                        }
                    });

                    dataStream.pipe(writeStream);
                }
                else {
                    socket.emit(self.APISpec.AppendFile.ERR, path, SYSTEM.ERROR.FSNotExist);
                    release();
                }
            });
        }
    });

    socket.on(self.APISpec.SaveURLAs.REQ, function(_path, fileURL) {
        var realPath = resolvePath(_path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.SaveURLAs.ERR, _path, realPath);
        else {
            if (fs.existsSync(path.dirname(realPath))) {
                var fileStream;

                if (fs.existsSync(realPath)) {
                    var isDir = fs.lstatSync(realPath).isDirectory();

                    if (isDir) {
                        var fileName = url.parse(fileURL).pathname.split(path.sep).pop();
                        fileStream = fs.createWriteStream(realPath + path.sep + fileName);
                    }
                    else
                        fileStream = fs.createWriteStream(realPath);
                }
                else
                    fileStream = fs.createWriteStream(realPath);

                var options = {
                    host: url.parse(fileURL).host,
                    port: url.parse(fileURL).port || 80,
                    path: url.parse(fileURL).pathname
                };

                if (!options.host || !options.path) {
                    socket.emit(self.APISpec.SaveURLAs.ERR, _path, SYSTEM.ERROR.FSInvalidURL);
                }
                else {
                    http.get(options, function(res) {
                        res.on('data', function(data) {
                            fileStream.write(data);
                        }).on('end', function() {
                            fileStream.end();
                            socket.emit(self.APISpec.SaveURLAs.RES, _path);
                        });
                    }).on('error', function(e) {
                        console.log("http.get got error: " + e.message);
                    });
                }
            }
        }
    });

    socket.on(self.APISpec.Grep.REQ, function(path, regex, option) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.Grep.ERR, path, realPath);
        else {
            var defaultOption = {
                encoding: 'utf8',
                regExpModifiers: 'gi',
                onlyMatching: true, /* Return only the matching part of the lines */
                onlyTesting: false, /* Return true or false */
                parseFormat: false /* Parse supported format and grep content text only without format tags */
            };

            option = option || defaultOption;
            option.encoding = option.encoding || defaultOption.encoding;
            option.regExpModifiers = option.regExpModifiers || defaultOption.regExpModifiers;
            option.onlyMatching = option.onlyMatching || defaultOption.onlyMatching;
            option.onlyTesting = option.onlyTesting || defaultOption.onlyTesting;
            option.parseFormat = option.parseFormat || defaultOption.parseFormat;

            if (fs.existsSync(realPath)) {
                fs.readFile(realPath, option.encoding, function(err, data) {
                    if (err) {
                        socket.emit(self.APISpec.Grep.ERR, path, SYSTEM.ERROR.FSIOError);
                    }
                    else {
                        if (option.parseFormat) {
                            var ext = path.split('.').pop();
                            /* Convert html to text */
                            if (ext.toLowerCase() === 'htm' || ext.toLowerCase() === 'html') {
                                var title = data.match(new RegExp(/<title>(.*?)<\/title>/i));
                                var text = htmlToText.fromString(data);
                                if (title && title.length > 1)
                                    data = title[1] + '\n' + text;
                                else
                                    data = text;
                            }
                        }

                        var result;
                        try {
                            result = data.match(new RegExp(regex, option.regExpModifiers));
                        }
                        catch (e) {}

                        if (option.onlyTesting) {
                            if (result) result = true;
                            else result = false;
                        }
                        else if (!option.onlyMatching && result)
                            result = data; /* Return full content since onlyMatching is set to false */

                        socket.emit(self.APISpec.Grep.RES, path, result);
                    }
                });

            }
            else
                socket.emit(self.APISpec.Grep.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });


    /**
     * Protocol Listener: File Handle Events
     */
    socket.on(self.APISpec.Open.REQ, function(path, flag, mode) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(self.APISpec.Open.ERR, path, realPath);
        else {
            if (fs.existsSync(realPath)) {
                fs.open(realPath, flag, mode, function(err, fd) {
                    if (err) {
                        socket.emit(self.APISpec.Open.ERR, path, SYSTEM.ERROR.FSIOERR);
                    }
                    else
                        socket.emit(self.APISpec.Open.RES, path, fd);
                });
            }
            else
                socket.emit(self.APISpec.Open.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(self.APISpec.Close.REQ, function(fileHandle) {
        if (fileHandle) {
            fs.close(fileHandle, function(err) {
                if (err) {
                    socket.emit(self.APISpec.Close.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else
                    socket.emit(self.APISpec.Close.RES, fileHandle);
            });
        }
        else
            socket.emit(self.APISpec.Close.ERR, fileHandle, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(self.APISpec.ReadData.REQ, function(fileHandle, offset, size) {
        if (fileHandle) {
            var buffer = new Buffer(size);
            fs.read(fileHandle, buffer, offset, size, 0, function(err, bytesRead, buffer) {
                if (err) {
                    socket.emit(self.APISpec.ReadData.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else {
                    socket.emit(self.APISpec.ReadData.RES, fileHandle, buffer, bytesRead);
                }
            });
        }
        else
            socket.emit(self.APISpec.ReadData.ERR, fileHandle, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(self.APISpec.WriteData.REQ, function(fileHandle, offset, size, data) {
        if (fileHandle) {
            fs.write(fileHandle, data, offset, size, 0, function(err, written, buffer) {
                if (err) {
                    socket.emit(self.APISpec.WriteData.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else {
                    socket.emit(self.APISpec.WriteData.RES, fileHandle, written);
                }
            });
        }
        else
            socket.emit(self.APISpec.WriteData.ERR, fileHandle, SYSTEM.ERROR.FSNotExist);
    });

    complete && complete();
}

FileManager.prototype.unregister = function(socket) {
    var self = this;
    socket.removeAllListeners(self.APISpec.List.REQ);
    socket.removeAllListeners(self.APISpec.StatList.REQ);
    socket.removeAllListeners(self.APISpec.CreateFile.REQ);
    socket.removeAllListeners(self.APISpec.CreateDirectory.REQ);
    socket.removeAllListeners(self.APISpec.CreateHardLink.REQ);
    socket.removeAllListeners(self.APISpec.CreateSymbolicLink.REQ);
    socket.removeAllListeners(self.APISpec.Remove.REQ);
    socket.removeAllListeners(self.APISpec.Move.REQ);
    socket.removeAllListeners(self.APISpec.Copy.REQ);
    socket.removeAllListeners(self.APISpec.Exist.REQ);
    socket.removeAllListeners(self.APISpec.Stat.REQ);
    socket.removeAllListeners(self.APISpec.Touch.REQ);
    socket.removeAllListeners(self.APISpec.ReadFile.REQ);
    socket.removeAllListeners(self.APISpec.WriteFile.REQ);
    socket.removeAllListeners(self.APISpec.AppendFile.REQ);
    socket.removeAllListeners(self.APISpec.SaveURLAs.REQ);
    socket.removeAllListeners(self.APISpec.Grep.REQ);
    socket.removeAllListeners(self.APISpec.Open.REQ);
    socket.removeAllListeners(self.APISpec.Close.REQ);
    socket.removeAllListeners(self.APISpec.ReadData.REQ);
    socket.removeAllListeners(self.APISpec.WriteData.REQ);
}
