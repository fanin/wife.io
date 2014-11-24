var fs = require('graceful-fs'),
    fse = require('fs-extra'),
    ss = require('socket.io-stream'),
    child_process = require('child_process'),
    htmlToText = require('html-to-text');
var SYSTEM = require('../system');

module.exports = FileManager;

function FileManager() {}

FileManager.prototype.register = function(_super, socket, protoFS) {
    var self = this;
    var security = _super.securityManager[socket];

    /**
     * Protocol Listener: File System Events
     */
    socket.on(protoFS.List.REQ, function(path) {
        try {
            var items = fs.readdirSync(security.getUserDataPath(path));
            socket.emit(protoFS.List.RES, path, items);
        }
        catch (err) {
            console.log('List: ' + err);
            socket.emit(protoFS.List.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.StatList.REQ, function(path) {
        try {
            var items = fs.readdirSync(security.getUserDataPath(path));
            var itemStats = [];
            items.forEach(function(file) {
                var stat = fs.lstatSync(security.getUserDataPath(path) + '/' + file);
                itemStats.push(stat);
            });
            socket.emit(protoFS.StatList.RES, path, items, itemStats);
        }
        catch (err) {
            console.log('List: ' + err);
            socket.emit(protoFS.StatList.ERR, path, SYSTEM.ERROR.FSNotExist);
        }
    });

    socket.on(protoFS.CreateFile.REQ, function(path) {
        fs.createFile(security.getUserDataPath(path), function(err) {
            if (err) {
                console.log('CreateFile: ' + err);
                socket.emit(protoFS.CreateFile.ERR, path, SYSTEM.ERROR.FSIOError);
            }
            else {
                socket.emit(protoFS.CreateFile.RES, path);
            }
        });
    });

    socket.on(protoFS.CreateDirectory.REQ, function(path) {
        fse.mkdirp(security.getUserDataPath(path), function(err) {
            if (err) {
                console.log('CreateDirectory: ' + err);
                socket.emit(protoFS.CreateDirectory.ERR, path, SYSTEM.ERROR.FSIOError);
            }
            else {
                socket.emit(protoFS.CreateDirectory.RES, path);
            }
        });
    });

    socket.on(protoFS.CreateHardLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = security.getUserDataPath(srcPath);
        var realDstPath = security.getUserDataPath(dstPath);

        if (!fs.existsSync(realSrcPath))
            socket.emit(protoFS.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
        else if (!fs.linkSync(realSrcPath, realDstPath))
            socket.emit(protoFS.CreateHardLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
        else
            socket.emit(protoFS.CreateHardLink.RES, srcPath, dstPath);
    });

    socket.on(protoFS.CreateSymbolicLink.REQ, function(srcPath, dstPath) {
        var realSrcPath = security.getUserDataPath(srcPath);
        var realDstPath = security.getUserDataPath(dstPath);

        if (!fs.existsSync(realSrcPath))
            socket.emit(protoFS.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
        else if (!fs.symlinkSync(realSrcPath, realDstPath))
            socket.emit(protoFS.CreateSymbolicLink.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
        else
            socket.emit(protoFS.CreateSymbolicLink.RES, srcPath, dstPath);
    });

    socket.on(protoFS.Remove.REQ, function(path) {
        var realPath = security.getUserDataPath(path);

        if (fs.existsSync(realPath)) {
            fse.remove(realPath, function(err) {
                if (err) {
                    console.log('Remove: ' + err);
                    socket.emit(protoFS.Remove.ERR, path, SYSTEM.ERROR.FSIOError);
                }
                else
                    socket.emit(protoFS.Remove.RES, path);
            });
        }
        else
            socket.emit(protoFS.Remove.ERR, path, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(protoFS.Move.REQ, function(srcPath, dstPath) {
        var realSrcPath = security.getUserDataPath(srcPath);
        var realDstPath = security.getUserDataPath(dstPath);

        if (fs.existsSync(realSrcPath)) {
            fse.move(realSrcPath, realDstPath, function(err) {
                if (err) {
                    console.log('Move: ' + err);
                    socket.emit(protoFS.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
                }
                else
                    socket.emit(protoFS.Move.RES, srcPath, dstPath);
            });
        }
        else
            socket.emit(protoFS.Move.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(protoFS.Copy.REQ, function(srcPath, dstPath) {
        var realSrcPath = security.getUserDataPath(srcPath);
        var realDstPath = security.getUserDataPath(dstPath);

        if (fs.existsSync(realSrcPath)) {
            fse.copy(realSrcPath, realDstPath, function(err) {
                if (err) {
                    console.log('Copy: ' + err);
                    socket.emit(protoFS.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.FSIOError);
                }
                else
                    socket.emit(protoFS.Copy.RES, srcPath, dstPath);
            });
        }
        else
            socket.emit(protoFS.Copy.ERR, srcPath, dstPath, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(protoFS.Exist.REQ, function(path) {
        var exist = fs.existsSync(security.getUserDataPath(path));
        var isDir = exist ? fs.lstatSync(security.getUserDataPath(path)).isDirectory() : false;
        socket.emit(protoFS.Exist.RES, path, exist, isDir);
    });

    socket.on(protoFS.Stat.REQ, function(path) {
        var exist = fs.existsSync(security.getUserDataPath(path));
        if (exist) {
            var stat = fs.lstatSync(security.getUserDataPath(path));
            socket.emit(protoFS.Stat.RES, path, stat);
        }
        else
            socket.emit(protoFS.Stat.ERR, path, SYSTEM.ERROR.FSIOError);
    });

    socket.on(protoFS.Touch.REQ, function(path, atime, mtime) {
        var exist = fs.existsSync(security.getUserDataPath(path));
        if (exist) {
            fs.utimesSync(security.getUserDataPath(path), new Date(atime), new Date(mtime));
            socket.emit(protoFS.Touch.RES, path);
        }
        else
            socket.emit(protoFS.Touch.ERR, path, SYSTEM.ERROR.FSIOError);
    });

    socket.on(protoFS.ReadFile.REQ, function(path, encoding) {
        var realPath = security.getUserDataPath(path);

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
                    console.log('ReadFile: ' + err);
                    socket.emit(protoFS.ReadFile.ERR, path, SYSTEM.ERROR.FSIOError);
                }
                else {
                    socket.emit(protoFS.ReadFile.RES, path, data);
                }
            });

        }
        else
            socket.emit(protoFS.ReadFile.ERR, path, SYSTEM.ERROR.FSNotExist);
    });

    /* TODO: wait lock for writing same file by multiple request */
    ss(socket).on(protoFS.WriteFile.REQ, function(path, dataStream, dataSize) {
        var realPath = security.getUserDataPath(path);
        var writeStream = fs.createWriteStream(realPath);
        var size = 0;
        var currentProgress = -1;

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
            /* TODO: Set file permission to 0666 */
        });

        dataStream.on('error', function(err) {
            if (err) {
                console.log('WriteFile: ' + err);
                socket.emit(protoFS.WriteFile.ERR, path, SYSTEM.ERROR.FSIOError);
            }
        });

        dataStream.pipe(writeStream);

        /*
        fs.writeFile(path, data, function(err) {
            if (err) {
                console.log('WriteFile: ' + err);
                socket.emit(protoFS.WriteFile.ERR, path, SYSTEM.ERROR.FSIOError);
            }
        });
        */
    });

    ss(socket).on(protoFS.AppendFile.REQ, function(path, dataStream, dataSize) {
        var realPath = security.getUserDataPath(path);

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
            });

            dataStream.on('error', function(err) {
                if (err) {
                    console.log('AppendFile: ' + err);
                    socket.emit(protoFS.AppendFile.ERR, path, SYSTEM.ERROR.FSIOError);
                }
            });

            dataStream.pipe(writeStream);
        }
        else
            socket.emit(protoFS.AppendFile.ERR, path, SYSTEM.ERROR.FSNotExist);

        /*
        if (fs.existsSync(realPath)) {
            fs.AppendFile(realPath, data, function(err) {
                if (err) {
                    console.log('AppendFile: ' + err);
                    socket.emit(protoFS.AppendFile.ERR, path, SYSTEM.ERROR.FSIOError);
                }
            });
        }
        else
            socket.emit(protoFS.AppendFile.ERR, path, SYSTEM.ERROR.FSNotExist);
        */
    });

    socket.on(protoFS.Grep.REQ, function(path, regex, option) {
        var realPath = security.getUserDataPath(path);
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
                    console.log('Grep ReadFile: ' + err);
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
    });


    /**
     * Protocol Listener: File Handle Events
     */
    socket.on(protoFS.Open.REQ, function(path, flag, mode) {
        var realPath = security.getUserDataPath(path);

        if (fs.existsSync(realPath)) {
            fs.open(realPath, flag, mode, function(err, fd) {
                if (err) {
                    console.log('Open: ' + err);
                    socket.emit(protoFS.Open.ERR, path, SYSTEM.ERROR.FSIOERR);
                }
                else
                    socket.emit(protoFS.Open.RES, path, fd);
            });
        }
        else
            socket.emit(protoFS.Open.ERR, path, SYSTEM.ERROR.FSNotExist);
    });

    socket.on(protoFS.Close.REQ, function(fileHandle) {
        if (fileHandle) {
            fs.close(fileHandle, function(err) {
                if (err) {
                    console.log('Close: ' + err);
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
                    console.log('ReadData: ' + err);
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
                    console.log('WriteData: ' + err);
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
}

FileManager.prototype.unregister = function(socket, protoFS) {
    socket.removeAllListeners(protoFS.List.REQ);
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
    socket.removeAllListeners(protoFS.Grep.REQ);
    socket.removeAllListeners(protoFS.Open.REQ);
    socket.removeAllListeners(protoFS.Close.REQ);
    socket.removeAllListeners(protoFS.ReadData.REQ);
    socket.removeAllListeners(protoFS.WriteData.REQ);
}
