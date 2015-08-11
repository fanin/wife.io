'use strict';

var apiutil = require('utils/apiutil');

//
// path format: `path:[disk_uuid]:[data_area]`
// data area:
//    0: App User Data Area
//    1: App Built-in Data Area
//    2: Shared Data Area
//

function parsePath(path) {
    var comp = path.split(':');

    if (comp.length === 1)
        return { path: comp[0], disk_uuid: null, data_area: 0 };
    else if (comp.length === 2)
        return { path: comp[0], disk_uuid: comp[1], data_area: 0 };
    else if (comp.length === 3)
        return { path: comp[0], disk_uuid: comp[1], data_area: comp[2] };
    else
        return null;
}

function mergeOptions(opts) {
    var options = '';

    for (var i = 0; i < opts.length; i++) {
        if (!opts[i]) continue;
        if (options == '')
            options += '?' + opts[i];
        else
            options += '&' + opts[i];
    }

    return options;
}

module.exports = {

    writeFile: function(path, data, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ code: 400, message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        var blob;

        if (data instanceof Blob)
            blob = data;
        else if (typeof data === 'string')
            blob = new Blob([data], { type : 'text/plain' });
        else
            blob = new Blob([data], { type : 'application/octet-stream' });

        apiutil.upload('/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions, blob, {}, {
            success: function(xhr, data) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            },
            progress: function(xhr, progress) {
                callbacks.onProgress && callbacks.onProgress(progress, xhr);
            }
        });
    },

    appendFile: function(path, data, options, callbacks) { //FIXME: merge options & callbacks
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 3 ? 'public_data=1' : '';
        var optEncoding = options.encoding ? 'encoding=' + options.encoding : '';

        var apiOptions = mergeOptions([ 'append=1', optDiskuuid, optDataArea, optEncoding ]);

        var blob;

        if (data instanceof Blob)
            blob = data;
        else if (typeof data === 'string')
            blob = new Blob([data], { type : 'text/plain' });
        else
            blob = new Blob([data], { type : 'application/octet-stream' });

        apiutil.upload('/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions, blob, {}, {
            success: function(xhr, data) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            },
            progress: function(xhr, progress) {
                callbacks.onProgress && callbacks.onProgress(progress, xhr);
            }
        });
    },

    abortUploadFile: function(xhr) {
        apiutil.abort(xhr);
    },

    readFile: function(path, options, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 1
                            ? 'builtin_data=1'
                            : p.data_area == 2 ? 'public_data=1' : '';
        var optEncoding = options.encoding ? 'encoding=' + options.encoding : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea, optEncoding ]);

        apiutil.get('/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions, {
            success: function(xhr, data) {
                callbacks.onSuccess && callbacks.onSuccess(data, xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            },
            progress: function(xhr, progress) {
                callbacks.onProgress && callbacks.onProgress(progress, xhr);
            }
        });
    },

    removeFile: function(path, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        apiutil.delete('/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    list: function(path, options, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';
        var optGetStat  = options.getStat ? 'get_stat=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea, optGetStat ]);

        apiutil.get('/api/v1/fs/ls/' + encodeURIComponent(p.path) + apiOptions, {
            success: function(xhr, list) {
                callbacks.onSuccess && callbacks.onSuccess(list.files, list.stats, xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    createDirectory: function(path, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        apiutil.post('/api/v1/fs/mkdir/' + encodeURIComponent(p.path) + apiOptions, null, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    createLink: function(sourcePath, targetPath, options, callbacks) {
        callbacks = callbacks || {};

        var src = parsePath(sourcePath);
        var tgt = parsePath(targetPath);

        if (!src || !tgt)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        if (src.disk_uuid !== tgt.disk_uuid && !options.symbolic)
            return (callbacks.onError && callbacks.onError({ message: 'Cross-device link' }));

        var optDiskuuid = src.disk_uuid ? 'disk_uuid=' + src.disk_uuid : '';
        var optDataArea = src.data_area == 2 ? 'public_data=1' : '';
        var optSymblic  = options.symbolic ? 'symbolic=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea, optSymblic ]);

        apiutil.post('/api/v1/fs/ln/' + encodeURIComponent(src.path) + '/' + encodeURIComponent(tgt.path) + apiOptions, null, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    move: function(sourcePath, targetPath, callbacks) {
        callbacks = callbacks || {};

        var src = parsePath(sourcePath);
        var tgt = parsePath(targetPath);

        if (!src || !tgt)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optSrcDiskuuid = src.disk_uuid ? 'src_disk_uuid=' + src.disk_uuid : '';
        var optSrcDataArea = src.data_area == 2 ? 'src_public_data=1' : '';
        var optTgtDiskuuid = tgt.disk_uuid ? 'tgt_disk_uuid=' + src.disk_uuid : '';
        var optTgtDataArea = tgt.data_area == 2 ? 'tgt_public_data=1' : '';

        var apiOptions = mergeOptions([ optSrcDiskuuid, optSrcDataArea, optTgtDiskuuid, optTgtDataArea ]);

        apiutil.post('/api/v1/fs/mv/' + encodeURIComponent(src.path) + '/' + encodeURIComponent(tgt.path) + apiOptions, null, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    copy: function(sourcePath, targetPath, callbacks) {
        callbacks = callbacks || {};

        var src = parsePath(sourcePath);
        var tgt = parsePath(targetPath);

        if (!src || !tgt)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optSrcDiskuuid = src.disk_uuid ? 'src_disk_uuid=' + src.disk_uuid : '';
        var optSrcDataArea = src.data_area == 2 ? 'src_public_data=1' : '';
        var optTgtDiskuuid = tgt.disk_uuid ? 'tgt_disk_uuid=' + src.disk_uuid : '';
        var optTgtDataArea = tgt.data_area == 2 ? 'tgt_public_data=1' : '';

        var apiOptions = mergeOptions([ optSrcDiskuuid, optSrcDataArea, optTgtDiskuuid, optTgtDataArea ]);

        apiutil.post('/api/v1/fs/cp/' + encodeURIComponent(src.path) + '/' + encodeURIComponent(tgt.path) + apiOptions, null, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    exist: function(path, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onSuccess && callbacks.onSuccess(false));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        apiutil.get('/api/v1/fs/exist/' + encodeURIComponent(p.path) + apiOptions, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(true);
            },
            error: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(false);
            }
        });
    },

    stat: function(path, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        apiutil.get('/api/v1/fs/stat/' + encodeURIComponent(p.path) + apiOptions, {
            success: function(xhr, stat) {
                callbacks.onSuccess && callbacks.onSuccess(stat, xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    touch: function(path, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        apiutil.put('/api/v1/fs/touch/' + encodeURIComponent(p.path) + apiOptions, null, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    wget: function(path, url, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

        var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

        apiutil.get('/api/v1/fs/wget/' + encodeURIComponent(p.path) + '/' + encodeURIComponent(url) + apiOptions, {
            success: function(xhr) {
                callbacks.onSuccess && callbacks.onSuccess(xhr);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    grep: function(path, pattern, options, callbacks) {
        callbacks = callbacks || {};

        var p = parsePath(path);

        if (!p)
            return (callbacks.onError && callbacks.onError({ message: 'Invalid path' }));

        var optDiskuuid  = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
        var optDataArea  = p.data_area == 2 ? 'public_data=1' : '';
        var optEncoding  = options.encoding ? 'encoding=' + options.encoding : '';
        var optRegexMod  = options.regexModifier ? 'regex_modifier=' + options.regexModifier : '';
        var optMatchOnly = options.matchOnly ? 'match_only=1' : '';
        var optTestOnly  = options.testOnly ? 'test_only=1' : '';
        var optParseForm = options.parseFormat ? 'parse_format=1' : '';

        var apiOptions = mergeOptions([
            optDiskuuid,
            optDataArea,
            optEncoding,
            optRegexMod,
            optMatchOnly,
            optTestOnly,
            optParseForm
        ]);

        apiutil.get('/api/v1/fs/grep/' + encodeURIComponent(p.path) + '/' + encodeURIComponent(pattern) + apiOptions, {
            success: function(xhr, data) {
                if (options.testOnly) {
                    if (xhr.status == 200)
                        callbacks.onSuccess && callbacks.onSuccess(true);
                    else
                        callbacks.onSuccess && callbacks.onSuccess(false);
                }
                else {
                    if (xhr.status == 200)
                        callbacks.onSuccess && callbacks.onSuccess(data);
                    else
                        callbacks.onSuccess && callbacks.onSuccess();
                }
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    }
};
