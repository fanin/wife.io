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

function FileManager() {}

FileManager.prototype.register = function(_super, socket, protoFS, complete) {
    var self = this;
    var storage = _super.storageManager;

    /**
     * Protocol Listener: File System Events
     */
    socket.on(protoFS.List.REQ, function(path) {
        try {
            var realPath = storage.getUserDataPath(path);

            if (SYSTEM.ERROR.HasError(realPath))
                socket.emit(protoFS.List.ERR, path, realPath);
            else {
                var items = fs.readdirSync(realPath);
                socket.emit(protoFS.List.RES, path, items);
            }
        }
        catch (err) {
            socket.emit(protoFS.List.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.StatList.REQ, function(path) {
        try {
            var realPath = storage.getUserDataPath(path);

            if (SYSTEM.ERROR.HasError(realPath))
                socket.emit(protoFS.StatList.ERR, path, realPath);
            else {
                var items = fs.readdirSync(realPath);
                var itemStats = [];
                items.forEach(function(file) {
                    var stat = fs.lstatSync(realPath + '/' + file);
                    itemStats.push(stat);
                });
                socket.emit(protoFS.StatList.RES, path, items, itemStats);
            }
        }
        catch (err) {
            socket.emit(protoFS.StatList.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.CreateFile.REQ, function(path) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.CreateFile.ERR, path, realPath);
        else {
            fs.createFile(realPath, function(err) {
                if (err) {
                    socket.emit(protoFS.CreateFile.ERR, path, SYSTEM.ERROR.FSIOError);
                }
                else {
                    socket.emit(protoFS.CreateFile.RES, path);
                }
            });
        }
    });

    socket.on(protoFS.CreateDirectory.REQ, function(path) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.CreateDirectory.ERR, path, realPath);
        else {
            fse.mkdirp(realPath, function(err) {
                if (err) {
                    socket.emit(protoFS.CreateDirectory.ERR, path, SYSTEM.ERROR.FSIOError);
                }
                else {
                    socket.emit(protoFS.CreateDirectory.RES, path);
                }
            });
        }
    });

    socket.on(protoFS.CreateHardLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = storage.getUserDataPath(srcPath);
        var realDstPath = storage.getUserDataPath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(protoFS.CreateHardLink.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(protoFS.CreateHardLink.ERR, srcPath, dstPath, realDstPath);
        else {
            if (!fs.existsSync(realSrcPath))
                socket.emit(protoFS.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
            else if (!fs.linkSync(realSrcPath, realDstPath))
                socket.emit(protoFS.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
            else
                socket.emit(protoFS.CreateHardLink.RES, srcPath, dstPath);
        }
    });

    socket.on(protoFS.CreateSymbolicLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = storage.getUserDataPath(srcPath);
        var realDstPath = storage.getUserDataPath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(protoFS.CreateSymbolicLink.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(protoFS.CreateSymbolicLink.ERR, srcPath, dstPath, realDstPath);
        else {
            if (!fs.existsSync(realSrcPath))
                socket.emit(protoFS.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
            else if (!fs.symlinkSync(realSrcPath, realDstPath))
                socket.emit(protoFS.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
            else
                socket.emit(protoFS.CreateSymbolicLink.RES, srcPath, dstPath);
        }
    });

    socket.on(protoFS.Remove.REQ, function(path) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.Remove.ERR, path, realPath);
        else {
            if (fs.existsSync(realPath)) {
                fse.remove(realPath, function(err) {
                    if (err) {
                        socket.emit(protoFS.Remove.ERR, path, SYSTEM.ERROR.FSIOError);
                    }
                    else
                        socket.emit(protoFS.Remove.RES, path);
                });
            }
            else
                socket.emit(protoFS.Remove.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.Move.REQ, function(srcPath, dstPath) {
        var realSrcPath = storage.getUserDataPath(srcPath);
        var realDstPath = storage.getUserDataPath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(protoFS.Move.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(protoFS.Move.ERR, srcPath, dstPath, realDstPath);
        else {
            if (fs.existsSync(realSrcPath)) {
                fse.move(realSrcPath, realDstPath, function(err) {
                    if (err) {
                        socket.emit(protoFS.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
                    }
                    else
                        socket.emit(protoFS.Move.RES, srcPath, dstPath);
                });
            }
            else
                socket.emit(protoFS.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.Copy.REQ, function(srcPath, dstPath) {
        var realSrcPath = storage.getUserDataPath(srcPath);
        var realDstPath = storage.getUserDataPath(dstPath);

        if (SYSTEM.ERROR.HasError(realSrcPath))
            socket.emit(protoFS.Copy.ERR, srcPath, dstPath, realSrcPath);
        else if (SYSTEM.ERROR.HasError(realDstPath))
            socket.emit(protoFS.Copy.ERR, srcPath, dstPath, realDstPath);
        else {
            if (fs.existsSync(realSrcPath)) {
                fse.copy(realSrcPath, realDstPath, function(err) {
                    if (err) {
                        socket.emit(protoFS.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
                    }
                    else
                        socket.emit(protoFS.Copy.RES, srcPath, dstPath);
                });
            }
            else
                socket.emit(protoFS.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.Exist.REQ, function(path) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.Exist.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            var isDir = exist ? fs.lstatSync(realPath).isDirectory() : false;
            socket.emit(protoFS.Exist.RES, path, exist, isDir);
        }
    });

    socket.on(protoFS.Stat.REQ, function(path) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.Stat.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            if (exist) {
                var stat = fs.lstatSync(realPath);
                socket.emit(protoFS.Stat.RES, path, stat);
            }
            else
                socket.emit(protoFS.Stat.ERR, path, SYSTEM.ERROR.FSIOError);
        }
    });

    socket.on(protoFS.Touch.REQ, function(path, atime, mtime) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.Touch.ERR, path, realPath);
        else {
            var exist = fs.existsSync(realPath);
            if (exist) {
                fs.utimesSync(realPath, new Date(atime), new Date(mtime));
                socket.emit(protoFS.Touch.RES, path);
            }
            else
                socket.emit(protoFS.Touch.ERR, path, SYSTEM.ERROR.FSIOError);
        }
    });

    socket.on(protoFS.ReadFile.REQ, function(path, encoding) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.ReadFile.ERR, path, realPath);
        else {
            encoding = encoding || 'utf8';

            if (fs.existsSync(realPath)) {
                /*
                var readStream = fs.createReadStream(path);
                readStream.on('open', function () {
                    var dataStream = ss.createStream();
                    ss(socket).emit(protoFS.ReadFile.RES, path, dataStream);
                    readStream.pipe(dataStream);
                });

                readStream.on('error', function(err) {
                    socket.emit(protoFS.ReadFile.ERR, path, SYSTEM.ERROR.FSIOError);
                });
                */

                fs.readFile(realPath, encoding, function(err, data) {
                    if (err) {
                        socket.emit(protoFS.ReadFile.ERR, path, SYSTEM.ERROR.FSIOError);
                    }
                    else {
                        socket.emit(protoFS.ReadFile.RES, path, data);
                    }
                });

            }
            else
                socket.emit(protoFS.ReadFile.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    ss(socket).on(protoFS.WriteFile.REQ, function(path, dataStream, dataSize) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.WriteFile.ERR, path, realPath);
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
                    socket.emit(protoFS.WriteFile.RES, path, progress);
                });

                dataStream.on('finish', function() {
                    socket.emit(protoFS.WriteFile.RES, path, 100);
                    dataStream.end();
                    release();
                });

                dataStream.on('error', function(err) {
                    if (err) {
                        socket.emit(protoFS.WriteFile.ERR, path, SYSTEM.ERROR.FSIOError);
                        release();
                    }
                });

                dataStream.pipe(writeStream);
            });
        }
    });

    ss(socket).on(protoFS.AppendFile.REQ, function(path, dataStream, dataSize) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.AppendFile.ERR, path, realPath);
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
                        socket.emit(protoFS.AppendFile.RES, path, progress);
                    });

                    dataStream.on('finish', function() {
                        socket.emit(protoFS.AppendFile.RES, path, 100);
                        dataStream.end();
                        release();
                    });

                    dataStream.on('error', function(err) {
                        if (err) {
                            socket.emit(protoFS.AppendFile.ERR, path, SYSTEM.ERROR.FSIOError);
                            release();
                        }
                    });

                    dataStream.pipe(writeStream);
                }
                else {
                    socket.emit(protoFS.AppendFile.ERR, path, SYSTEM.ERROR.FSNotExist);
                    release();
                }
            });
        }
    });

    socket.on(protoFS.SaveURLAs.REQ, function(_path, fileURL) {
        var realPath = storage.getUserDataPath(_path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.SaveURLAs.ERR, _path, realPath);
        else {
            if (fs.existsSync(path.dirname(realPath))) {
                var fileStream;

                if (fs.existsSync(realPath)) {
                    var isDir = fs.lstatSync(realPath).isDirectory();

                    if (isDir) {
                        var fileName = url.parse(fileURL).pathname.split('/').pop();
                        fileStream = fs.createWriteStream(realPath + '/' + fileName);
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
                    socket.emit(protoFS.SaveURLAs.ERR, _path, SYSTEM.ERROR.FSInvalidURL);
                }
                else {
                    http.get(options, function(res) {
                        res.on('data', function(data) {
                            fileStream.write(data);
                        }).on('end', function() {
                            fileStream.end();
                            socket.emit(protoFS.SaveURLAs.RES, _path);
                        });
                    });
                }
            }
        }
    });

    socket.on(protoFS.Grep.REQ, function(path, regex, option) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.Grep.ERR, path, realPath);
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
                        socket.emit(protoFS.Grep.ERR, path, SYSTEM.ERROR.FSIOError);
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

                        socket.emit(protoFS.Grep.RES, path, result);
                    }
                });

            }
            else
                socket.emit(protoFS.Grep.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });


    /**
     * Protocol Listener: File Handle Events
     */
    socket.on(protoFS.Open.REQ, function(path, flag, mode) {
        var realPath = storage.getUserDataPath(path);

        if (SYSTEM.ERROR.HasError(realPath))
            socket.emit(protoFS.Open.ERR, path, realPath);
        else {
            if (fs.existsSync(realPath)) {
                fs.open(realPath, flag, mode, function(err, fd) {
                    if (err) {
                        socket.emit(protoFS.Open.ERR, path, SYSTEM.ERROR.FSIOERR);
                    }
                    else
                        socket.emit(protoFS.Open.RES, path, fd);
                });
            }
            else
                socket.emit(protoFS.Open.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.Close.REQ, function(fileHandle) {
        if (fileHandle) {
            fs.close(fileHandle, function(err) {
                if (err) {
                    socket.emit(protoFS.Close.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else
                    socket.emit(protoFS.Close.RES, fileHandle);
            });
        }
        else
            socket.emit(protoFS.Close.ERR, fileHandle, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(protoFS.ReadData.REQ, function(fileHandle, offset, size) {
        if (fileHandle) {
            var buffer = new Buffer(size);
            fs.read(fileHandle, buffer, offset, size, 0, function(err, bytesRead, buffer) {
                if (err) {
                    socket.emit(protoFS.ReadData.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else {
                    socket.emit(protoFS.ReadData.RES, fileHandle, buffer, bytesRead);
                }
            });
        }
        else
            socket.emit(protoFS.ReadData.ERR, fileHandle, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(protoFS.WriteData.REQ, function(fileHandle, offset, size, data) {
        if (fileHandle) {
            fs.write(fileHandle, data, offset, size, 0, function(err, written, buffer) {
                if (err) {
                    socket.emit(protoFS.WriteData.ERR, fileHandle, SYSTEM.ERROR.FSIOERR);
                }
                else {
                    socket.emit(protoFS.WriteData.RES, fileHandle, written);
                }
            });
        }
        else
            socket.emit(protoFS.WriteData.ERR, fileHandle, SYSTEM.ERROR.FSNotExist);
    });

    complete && complete();
}

FileManager.prototype.unregister = function(socket, protoFS) {
    socket.removeAllListeners(protoFS.List.REQ);
    socket.removeAllListeners(protoFS.StatList.REQ);
    socket.removeAllListeners(protoFS.CreateFile.REQ);
    socket.removeAllListeners(protoFS.CreateDirectory.REQ);
    socket.removeAllListeners(protoFS.CreateHardLink.REQ);
    socket.removeAllListeners(protoFS.CreateSymbolicLink.REQ);
    socket.removeAllListeners(protoFS.Remove.REQ);
    socket.removeAllListeners(protoFS.Move.REQ);
    socket.removeAllListeners(protoFS.Copy.REQ);
    socket.removeAllListeners(protoFS.Exist.REQ);
    socket.removeAllListeners(protoFS.Stat.REQ);
    socket.removeAllListeners(protoFS.Touch.REQ);
    socket.removeAllListeners(protoFS.ReadFile.REQ);
    socket.removeAllListeners(protoFS.WriteFile.REQ);
    socket.removeAllListeners(protoFS.AppendFile.REQ);
    socket.removeAllListeners(protoFS.SaveURLAs.REQ);
    socket.removeAllListeners(protoFS.Grep.REQ);
    socket.removeAllListeners(protoFS.Open.REQ);
    socket.removeAllListeners(protoFS.Close.REQ);
    socket.removeAllListeners(protoFS.ReadData.REQ);
    socket.removeAllListeners(protoFS.WriteData.REQ);
}
