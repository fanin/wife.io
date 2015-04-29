"use strict";

var fs            = require('graceful-fs'),
    fse           = require('fs-extra'),
    path          = require('path'),
    ss            = require('socket.io-stream'),
    url           = require('url'),
    http          = require('http'),
    child_process = require('child_process'),
    ReadWriteLock = require('rwlock'),
    htmlToText    = require('html-to-text');

var SYSTEM = require('./system');
var rwlock = new ReadWriteLock();

module.exports = FileManager;

function FileManager(_super, wsapi) {
    this._super = _super;
    this.wsapi = wsapi;
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
    socket.on(self.wsapi.List.REQ, function(path) {
        try {
            var realPath = resolvePath(path);

            if (SYSTEM.ERROR.HAS_ERROR(realPath))
                socket.emit(self.wsapi.List.ERR, path, realPath);
            else {
                var items = fs.readdirSync(realPath);
                socket.emit(self.wsapi.List.RES, path, items);
            }
        }
        catch (err) {
            socket.emit(self.wsapi.List.ERR, path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    socket.on(self.wsapi.StatList.REQ, function(_path) {
        try {
            var realPath = resolvePath(_path);

            if (SYSTEM.ERROR.HAS_ERROR(realPath))
                socket.emit(self.wsapi.StatList.ERR, _path, realPath);
            else {
                var items = fs.readdirSync(realPath);
                var itemStats = [];
                items.forEach(function(file) {
                    var stat = fs.lstatSync(realPath + path.sep + file);
                    itemStats.push(stat);
                });
                socket.emit(self.wsapi.StatList.RES, _path, items, itemStats);
            }
        }
        catch (err) {
            socket.emit(self.wsapi.StatList.ERR, _path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    socket.on(self.wsapi.CreateFile.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.CreateFile.ERR, path, realPath);
        else {
            fs.createFile(realPath, function(err) {
                if (err) {
                    socket.emit(self.wsapi.CreateFile.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                }
                else {
                    socket.emit(self.wsapi.CreateFile.RES, path);
                }
            });
        }
    });

    socket.on(self.wsapi.CreateDirectory.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.CreateDirectory.ERR, path, realPath);
        else {
            fse.mkdirp(realPath, function(err) {
                if (err) {
                    socket.emit(self.wsapi.CreateDirectory.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                }
                else {
                    socket.emit(self.wsapi.CreateDirectory.RES, path);
                }
            });
        }
    });

    socket.on(self.wsapi.CreateHardLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HAS_ERROR(realSrcPath))
            socket.emit(self.wsapi.CreateHardLink.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HAS_ERROR(realDstPath))
            socket.emit(self.wsapi.CreateHardLink.ERR, srcPath, dstPath, realDstPath);
        else {
            if (!fs.existsSync(realSrcPath))
                socket.emit(self.wsapi.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
            else if (!fs.linkSync(realSrcPath, realDstPath))
                socket.emit(self.wsapi.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_IO);
            else
                socket.emit(self.wsapi.CreateHardLink.RES, srcPath, dstPath);
        }
    });

    socket.on(self.wsapi.CreateSymbolicLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HAS_ERROR(realSrcPath))
            socket.emit(self.wsapi.CreateSymbolicLink.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HAS_ERROR(realDstPath))
            socket.emit(self.wsapi.CreateSymbolicLink.ERR, srcPath, dstPath, realDstPath);
        else {
            if (!fs.existsSync(realSrcPath))
                socket.emit(self.wsapi.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
            else if (!fs.symlinkSync(realSrcPath, realDstPath))
                socket.emit(self.wsapi.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_IO);
            else
                socket.emit(self.wsapi.CreateSymbolicLink.RES, srcPath, dstPath);
        }
    });

    socket.on(self.wsapi.Remove.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.Remove.ERR, path, realPath);
        else {
            if (fs.existsSync(realPath)) {
                fse.remove(realPath, function(err) {
                    if (err) {
                        socket.emit(self.wsapi.Remove.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                    }
                    else
                        socket.emit(self.wsapi.Remove.RES, path);
                });
            }
            else
                socket.emit(self.wsapi.Remove.ERR, path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    socket.on(self.wsapi.Move.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HAS_ERROR(realSrcPath))
            socket.emit(self.wsapi.Move.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HAS_ERROR(realDstPath))
            socket.emit(self.wsapi.Move.ERR, srcPath, dstPath, realDstPath);
        else {
            if (fs.existsSync(realSrcPath)) {
                fse.move(realSrcPath, realDstPath, function(err) {
                    if (err) {
                        socket.emit(self.wsapi.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_IO);
                    }
                    else
                        socket.emit(self.wsapi.Move.RES, srcPath, dstPath);
                });
            }
            else
                socket.emit(self.wsapi.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    socket.on(self.wsapi.Copy.REQ, function(srcPath, dstPath) {
        var realSrcPath = resolvePath(srcPath);
        var realDstPath = resolvePath(dstPath);

        if (SYSTEM.ERROR.HAS_ERROR(realSrcPath))
            socket.emit(self.wsapi.Copy.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HAS_ERROR(realDstPath))
            socket.emit(self.wsapi.Copy.ERR, srcPath, dstPath, realDstPath);
        else {
            if (fs.existsSync(realSrcPath)) {
                fse.copy(realSrcPath, realDstPath, function(err) {
                    if (err) {
                        socket.emit(self.wsapi.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_IO);
                    }
                    else
                        socket.emit(self.wsapi.Copy.RES, srcPath, dstPath);
                });
            }
            else
                socket.emit(self.wsapi.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    socket.on(self.wsapi.Exist.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.Exist.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            var isDir = exist ? fs.lstatSync(realPath).isDirectory() : false;
            socket.emit(self.wsapi.Exist.RES, path, exist, isDir);
        }
    });

    socket.on(self.wsapi.Stat.REQ, function(path) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.Stat.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            if (exist) {
                var stat = fs.lstatSync(realPath);
                socket.emit(self.wsapi.Stat.RES, path, stat);
            }
            else
                socket.emit(self.wsapi.Stat.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
        }
    });

    socket.on(self.wsapi.Touch.REQ, function(path, atime, mtime) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.Touch.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            if (exist) {
                fs.utimesSync(realPath, new Date(atime), new Date(mtime));
                socket.emit(self.wsapi.Touch.RES, path);
            }
            else
                socket.emit(self.wsapi.Touch.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
        }
    });

    socket.on(self.wsapi.ReadFile.REQ, function(path, encoding) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.ReadFile.ERR, path, realPath);
        else {
            encoding = encoding || 'utf8';

            if (fs.existsSync(realPath)) {
                /*
                var readStream = fs.createReadStream(path);
                readStream.on('open', function () {
                    var dataStream = ss.createStream();
                    ss(socket).emit(self.wsapi.ReadFile.RES, path, dataStream);
                    readStream.pipe(dataStream);
                });

                readStream.on('error', function(err) {
                    socket.emit(self.wsapi.ReadFile.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                });
                */

                fs.readFile(realPath, encoding, function(err, data) {
                    if (err) {
                        socket.emit(self.wsapi.ReadFile.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                    }
                    else {
                        socket.emit(self.wsapi.ReadFile.RES, path, data);
                    }
                });

            }
            else
                socket.emit(self.wsapi.ReadFile.ERR, path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    ss(socket).on(self.wsapi.WriteFile.REQ, function(path, dataStream, dataSize) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.WriteFile.ERR, path, realPath);
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
                    socket.emit(self.wsapi.WriteFile.RES, path, progress);
                });

                dataStream.on('finish', function() {
                    socket.emit(self.wsapi.WriteFile.RES, path, 100);
                    dataStream.end();
                    release();
                });

                dataStream.on('error', function(err) {
                    if (err) {
                        socket.emit(self.wsapi.WriteFile.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                        release();
                    }
                });

                dataStream.pipe(writeStream);
            });
        }
    });

    ss(socket).on(self.wsapi.AppendFile.REQ, function(path, dataStream, dataSize) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.AppendFile.ERR, path, realPath);
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
                        socket.emit(self.wsapi.AppendFile.RES, path, progress);
                    });

                    dataStream.on('finish', function() {
                        socket.emit(self.wsapi.AppendFile.RES, path, 100);
                        dataStream.end();
                        release();
                    });

                    dataStream.on('error', function(err) {
                        if (err) {
                            socket.emit(self.wsapi.AppendFile.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
                            release();
                        }
                    });

                    dataStream.pipe(writeStream);
                }
                else {
                    socket.emit(self.wsapi.AppendFile.ERR, path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
                    release();
                }
            });
        }
    });

    socket.on(self.wsapi.SaveURLAs.REQ, function(_path, fileURL) {
        var realPath = resolvePath(_path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.SaveURLAs.ERR, _path, realPath);
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
                    socket.emit(self.wsapi.SaveURLAs.ERR, _path, SYSTEM.ERROR.ERROR_FS_INVALID_URL);
                }
                else {
                    http.get(options, function(res) {
                        res.on('data', function(data) {
                            fileStream.write(data);
                        }).on('end', function() {
                            fileStream.end();
                            socket.emit(self.wsapi.SaveURLAs.RES, _path);
                        });
                    }).on('error', function(e) {
                        console.log("http.get got error: " + e.message);
                    });
                }
            }
        }
    });

    socket.on(self.wsapi.Grep.REQ, function(path, regex, option) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.Grep.ERR, path, realPath);
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
                        socket.emit(self.wsapi.Grep.ERR, path, SYSTEM.ERROR.ERROR_FS_IO);
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

                        socket.emit(self.wsapi.Grep.RES, path, result);
                    }
                });

            }
            else
                socket.emit(self.wsapi.Grep.ERR, path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });


    /**
     * Protocol Listener: File Handle Events
     */
    socket.on(self.wsapi.Open.REQ, function(path, flag, mode) {
        var realPath = resolvePath(path);

        if (SYSTEM.ERROR.HAS_ERROR(realPath))
            socket.emit(self.wsapi.Open.ERR, path, realPath);
        else {
            if (fs.existsSync(realPath)) {
                fs.open(realPath, flag, mode, function(err, fd) {
                    if (err) {
                        socket.emit(self.wsapi.Open.ERR, path, SYSTEM.ERROR.FSIOERR);
                    }
                    else
                        socket.emit(self.wsapi.Open.RES, path, fd);
                });
            }
            else
                socket.emit(self.wsapi.Open.ERR, path, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
        }
    });

    socket.on(self.wsapi.Close.REQ, function(fileHandle) {
        if (fileHandle) {
            fs.close(fileHandle, function(err) {
                if (err) {
                    socket.emit(self.wsapi.Close.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else
                    socket.emit(self.wsapi.Close.RES, fileHandle);
            });
        }
        else
            socket.emit(self.wsapi.Close.ERR, fileHandle, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
    });

    socket.on(self.wsapi.ReadData.REQ, function(fileHandle, offset, size) {
        if (fileHandle) {
            var buffer = new Buffer(size);
            fs.read(fileHandle, buffer, offset, size, 0, function(err, bytesRead, buffer) {
                if (err) {
                    socket.emit(self.wsapi.ReadData.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else {
                    socket.emit(self.wsapi.ReadData.RES, fileHandle, buffer, bytesRead);
                }
            });
        }
        else
            socket.emit(self.wsapi.ReadData.ERR, fileHandle, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
    });

    socket.on(self.wsapi.WriteData.REQ, function(fileHandle, offset, size, data) {
        if (fileHandle) {
            fs.write(fileHandle, data, offset, size, 0, function(err, written, buffer) {
                if (err) {
                    socket.emit(self.wsapi.WriteData.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else {
                    socket.emit(self.wsapi.WriteData.RES, fileHandle, written);
                }
            });
        }
        else
            socket.emit(self.wsapi.WriteData.ERR, fileHandle, SYSTEM.ERROR.ERROR_FS_NOT_EXIST);
    });

    complete && complete();
}

FileManager.prototype.unregister = function(socket) {
    var self = this;
    socket.removeAllListeners(self.wsapi.List.REQ);
    socket.removeAllListeners(self.wsapi.StatList.REQ);
    socket.removeAllListeners(self.wsapi.CreateFile.REQ);
    socket.removeAllListeners(self.wsapi.CreateDirectory.REQ);
    socket.removeAllListeners(self.wsapi.CreateHardLink.REQ);
    socket.removeAllListeners(self.wsapi.CreateSymbolicLink.REQ);
    socket.removeAllListeners(self.wsapi.Remove.REQ);
    socket.removeAllListeners(self.wsapi.Move.REQ);
    socket.removeAllListeners(self.wsapi.Copy.REQ);
    socket.removeAllListeners(self.wsapi.Exist.REQ);
    socket.removeAllListeners(self.wsapi.Stat.REQ);
    socket.removeAllListeners(self.wsapi.Touch.REQ);
    socket.removeAllListeners(self.wsapi.ReadFile.REQ);
    socket.removeAllListeners(self.wsapi.WriteFile.REQ);
    socket.removeAllListeners(self.wsapi.AppendFile.REQ);
    socket.removeAllListeners(self.wsapi.SaveURLAs.REQ);
    socket.removeAllListeners(self.wsapi.Grep.REQ);
    socket.removeAllListeners(self.wsapi.Open.REQ);
    socket.removeAllListeners(self.wsapi.Close.REQ);
    socket.removeAllListeners(self.wsapi.ReadData.REQ);
    socket.removeAllListeners(self.wsapi.WriteData.REQ);
}
