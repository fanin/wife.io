"use strict";

var fs        = require('graceful-fs'),
    fse       = require('fs-extra'),
    async     = require('async'),
    path      = require('path'),
    url       = require('url'),
    http      = require('http'),
    https     = require('https'),
    html2text = require('html-to-text');

module.exports = {
    writeFile: fs.writeFile,
    readFile: fs.readFile,
    appendFile: fs.appendFile,
    removeFile: fse.remove,

    list: function(_path, option, callback) {
        if (option.stat) {
            fs.readdir(_path, function(error, files) {
                if (error)
                    callback(error, files);
                else {
                    var stats = files.map(function(file) {
                        var stat = fs.lstatSync(path.join(_path, file));
                        stat.isFile = stat.isFile();
                        stat.isDirectory = stat.isDirectory();
                        stat.isBlockDevice = stat.isBlockDevice();
                        stat.isCharacterDevice = stat.isCharacterDevice();
                        stat.isSymbolicLink = stat.isSymbolicLink();
                        stat.isFIFO = stat.isFIFO();
                        stat.isSocket = stat.isSocket();
                        return stat;
                    });
                    callback(error, files, stats);
                }
            });
        }
        else
            fs.readdir(_path, callback);
    },

    mkdir: fse.mkdirp,

    link: function(_src, _dst, option, callback) {
        if (option.symbolic)
            fs.symlink(_src, _dst, callback);
        else
            fs.link(_src, _dst, callback);
    },

    move: function(_src, _dst, callback) {
        fse.move(_src, _dst, { clobber: true }, callback);
    },

    copy: function(_src, _dst, callback) {
        fse.copy(_src, _dst, { clobber: true, preserveTimestamps: false }, callback);
    },

    exists: fs.exists,

    lstat: function(_path, callback) {
        fs.lstat(_path, function(err, stats) {
            stats.isFile = stats.isFile();
            stats.isDirectory = stats.isDirectory();
            stats.isBlockDevice = stats.isBlockDevice();
            stats.isCharacterDevice = stats.isCharacterDevice();
            stats.isSymbolicLink = stats.isSymbolicLink();
            stats.isFIFO = stats.isFIFO();
            stats.isSocket = stats.isSocket();
            callback(err, stats);
        });
    },

    touch: function(_path, atime, mtime, callback) {
        fs.utimes(_path, new Date(atime), new Date(mtime), callback);
    },

    wget: function(_path, _url, callback) {
        var fileStream;

        async.series([
            function(callback) {
                fs.exists(path.dirname(_path), function(exists) {
                    if (!exists)
                        fse.mkdirp(path.dirname(_path), function(error) {
                            if (error)
                                callback('mkdirp', false);
                            else
                                callback('', true);
                        });
                    else
                        callback('', true);
                });
            },
            function(callback) {
                fs.exists(_path, function(exists) {
                    if (exists) {
                        if (fs.lstatSync(_path).isDirectory()) {
                            var filename = _url.split('/').pop();
                            fileStream = fs.createWriteStream(path.join(_path, filename));
                        }
                        else
                            fileStream = fs.createWriteStream(_path);
                    }
                    else
                        fileStream = fs.createWriteStream(_path);
                    callback('', true);
                });
            },
            function(callback) {
                var options = url.parse(_url);

                if (options) {
                    var _cb = function(res) {
                        res.on('data', function(data) {
                            fileStream.write(data);
                        }).on('end', function() {
                            fileStream.end();
                            callback('', true);
                        });
                    };

                    if (options.protocol === 'http:')
                        http.get(options, _cb).on('error', function(e) {
                            callback('http.get', e);
                        });
                    else if (options.protocol === 'https:')
                        https.get(options, _cb).on('error', function(e) {
                            console.log('https get error', e);
                            callback('https.get', e);
                        });
                    else
                        callback('protocol', false);
                }
                else
                    callback('url.parse', false);
            }
        ], function(error, results) {
            switch (error) {
            case 'mkdirp':
                callback('Unable to create ' + _path);
                break;
            case 'protocol':
                callback('Unsupported protocol of ' + _url);
                break;
            case 'url':
                callback('Error while parsing url ' + _url);
                break;
            case 'http.get':
            case 'https.get':
                callback('Unable to get resource: ' + results[2]);
                break;
            default:
                callback();
                break;
            }
        });
    },

    grep: function(_path, pattern, option, callback) {
        var defaultOption = {
            encoding: 'utf8',
            regexModifiers: 'gi',
            matchOnly: true, /* Return only the matching part of the lines */
            testOnly: false, /* Return true or false */
            parseFormat: false /* Parse supported format and grep content text only without format tags */
        };

        option = option || defaultOption;
        option.encoding       = option.encoding || defaultOption.encoding;
        option.regexModifiers = option.regexModifiers || defaultOption.regexModifiers;
        option.matchOnly      = typeof option.matchOnly === 'boolean' ? option.matchOnly : defaultOption.matchOnly;
        option.testOnly       = typeof option.testOnly === 'boolean' ? option.testOnly : defaultOption.testOnly;
        option.parseFormat    = typeof option.parseFormat === 'boolean' ? option.parseFormat : defaultOption.parseFormat;

        fs.exists(_path, function(exists) {
            if (exists) {
                fs.readFile(_path, option.encoding, function(error, data) {
                    if (error)
                        return callback('Unable to read ' + _path);

                    if (option.parseFormat) {
                        var ext = _path.split('.').pop();
                        /* Convert html to text */
                        if (ext.toLowerCase() === 'htm' || ext.toLowerCase() === 'html') {
                            var title = data.match(new RegExp(/<title>(.*?)<\/title>/i));
                            var text = html2text.fromString(data);
                            if (title && title.length > 1)
                                data = title[1] + '\n' + text;
                            else
                                data = text;
                        }
                    }

                    var result;

                    try {
                        result = data.match(new RegExp(pattern, option.regexModifiers));
                    }
                    catch (e) {}

                    if (option.testOnly) {
                        result = result && true;
                    }
                    else if (result && option.matchOnly) {
                        result = Array.isArray(result) ? result[1] : result;
                    }
                    else if (result && !option.matchOnly)
                        result = data; /* Return full content since matchOnly is set to false */

                    callback(null, result);
                });
            }
            else
                callback('File not found');
        });
    }
};
