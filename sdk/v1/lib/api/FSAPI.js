'use strict';

import apiutil from 'lib/utils/apiutil';

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

export default {

  writeFile: function(path, data, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError({
          code: 400,
          message: 'Invalid path'
        });
        reject({
          api: 'fs.writeFile',
          code: 400,
          message: 'Invalid path'
        });
        return;
      }

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

      apiutil.upload(
        '/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions,
        blob, {},
        {
          success: function(xhr, data) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.writeFile', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.writeFile',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          },
          progress: function(xhr, progress) {
            options.onProgress && options.onProgress(progress, xhr);
          }
        }
      );
    });
  },

  appendFile: function(path, data, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.appendFile', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 3 ? 'public_data=1' : '';
      var optEncoding = options.encoding ? 'encoding=' + options.encoding : '';

      var apiOptions =
        mergeOptions([ 'append=1', optDiskuuid, optDataArea, optEncoding ]);

      var blob;

      if (data instanceof Blob)
        blob = data;
      else if (typeof data === 'string')
        blob = new Blob([data], { type : 'text/plain' });
      else
        blob = new Blob([data], { type : 'application/octet-stream' });

      apiutil.upload(
        '/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions,
        blob, {},
        {
          success: function(xhr, data) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.appendFile', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.appendFile',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          },
          progress: function(xhr, progress) {
            options.onProgress && options.onProgress(progress, xhr);
          }
        }
      );
    });
  },

  abortUploadFile: function(xhr) {
    apiutil.abort(xhr);
  },

  readFile: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.readFile', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 1
                ? 'builtin_data=1'
                : p.data_area == 2 ? 'public_data=1' : '';
      var optEncoding = options.encoding ? 'encoding=' + options.encoding : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea, optEncoding ]);

      apiutil.get('/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions, {
        success: function(xhr, data) {
          options.onSuccess && options.onSuccess(data, xhr);
          resolve({ api: 'fs.readFile', data: data, xhr: xhr });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'fs.readFile',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        },
        progress: function(xhr, progress) {
          options.onProgress && options.onProgress(progress, xhr);
        }
      });
    });
  },

  removeFile: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.removeFile', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

      apiutil.delete('/api/v1/fs/file/' + encodeURIComponent(p.path) + apiOptions, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'fs.removeFile', xhr: xhr });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'fs.removeFile',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  list: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.list', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';
      var optGetStat  = options.getStat ? 'get_stat=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea, optGetStat ]);

      apiutil.get('/api/v1/fs/ls/' + encodeURIComponent(p.path) + apiOptions, {
        success: function(xhr, list) {
          options.onSuccess && options.onSuccess(list.files, list.stats, xhr);
          resolve({
            api: 'fs.list',
            files: list.files,
            stats: list.stats,
            xhr: xhr
          });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'fs.list',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  createDirectory: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.createDirectory', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

      apiutil.post('/api/v1/fs/mkdir/' + encodeURIComponent(p.path) + apiOptions, null, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'fs.createDirectory', xhr: xhr });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'fs.createDirectory',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  createLink: function(sourcePath, targetPath, options = {}) {
    return new Promise(function(resolve, reject) {
      var src = parsePath(sourcePath);
      var tgt = parsePath(targetPath);

      if (!src || !tgt) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.createLink', code: 403, message: 'Invalid path' });
        return;
      }

      if (src.disk_uuid !== tgt.disk_uuid && !options.symbolic) {
        options.onError && options.onError({
          code: 403,
          message: 'Cross-device link'
        });
        reject({
          api: 'fs.createLink',
          code: 403,
          message: 'Cross-device link'
        });
        return;
      }

      var optDiskuuid = src.disk_uuid ? 'disk_uuid=' + src.disk_uuid : '';
      var optDataArea = src.data_area == 2 ? 'public_data=1' : '';
      var optSymblic  = options.symbolic ? 'symbolic=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea, optSymblic ]);

      apiutil.post(
        '/api/v1/fs/ln/' + encodeURIComponent(src.path) + '/'
                         + encodeURIComponent(tgt.path) + apiOptions,
        null,
        {
          success: function(xhr) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.createLink', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.createLink',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          }
        }
      );
    });
  },

  move: function(sourcePath, targetPath, options = {}) {
    return new Promise(function(resolve, reject) {
      var src = parsePath(sourcePath);
      var tgt = parsePath(targetPath);

      if (!src || !tgt) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.move', code: 403, message: 'Invalid path' });
        return;
      }

      var optSrcDiskuuid = src.disk_uuid ? 'src_disk_uuid=' + src.disk_uuid : '';
      var optSrcDataArea = src.data_area == 2 ? 'src_public_data=1' : '';
      var optTgtDiskuuid = tgt.disk_uuid ? 'tgt_disk_uuid=' + src.disk_uuid : '';
      var optTgtDataArea = tgt.data_area == 2 ? 'tgt_public_data=1' : '';

      var apiOptions = mergeOptions(
        [ optSrcDiskuuid, optSrcDataArea, optTgtDiskuuid, optTgtDataArea ]
      );

      apiutil.post(
        '/api/v1/fs/mv/' + encodeURIComponent(src.path) + '/'
                         + encodeURIComponent(tgt.path) + apiOptions,
        null,
        {
          success: function(xhr) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.move', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.move',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          }
        }
      );
    });
  },

  copy: function(sourcePath, targetPath, options = {}) {
    return new Promise(function(resolve, reject) {
      var src = parsePath(sourcePath);
      var tgt = parsePath(targetPath);

      if (!src || !tgt) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.copy', code: 403, message: 'Invalid path' });
        return;
      }

      var optSrcDiskuuid = src.disk_uuid ? 'src_disk_uuid=' + src.disk_uuid : '';
      var optSrcDataArea = src.data_area == 2 ? 'src_public_data=1' : '';
      var optTgtDiskuuid = tgt.disk_uuid ? 'tgt_disk_uuid=' + src.disk_uuid : '';
      var optTgtDataArea = tgt.data_area == 2 ? 'tgt_public_data=1' : '';

      var apiOptions = mergeOptions(
        [ optSrcDiskuuid, optSrcDataArea, optTgtDiskuuid, optTgtDataArea ]
      );

      apiutil.post(
        '/api/v1/fs/cp/' + encodeURIComponent(src.path) + '/'
                         + encodeURIComponent(tgt.path) + apiOptions,
        null,
        {
          success: function(xhr) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.copy', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.copy',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          }
        }
      );
    });
  },

  exist: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onSuccess && options.onSuccess(false);
        resolve({ api: 'fs.exist', exist: false });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

      apiutil.get('/api/v1/fs/exist/' + encodeURIComponent(p.path) + apiOptions, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(true);
          resolve({ api: 'fs.exist', exist: true });
        },
        error: function(xhr) {
          options.onSuccess && options.onSuccess(false);
          resolve({ api: 'fs.exist', exist: false });
        }
      });
    });
  },

  stat: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.stat', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

      apiutil.get('/api/v1/fs/stat/' + encodeURIComponent(p.path) + apiOptions, {
        success: function(xhr, stat) {
          options.onSuccess && options.onSuccess(stat, xhr);
          resolve({ api: 'fs.stat', stat: stat, xhr: xhr });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'fs.stat',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  touch: function(path, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.touch', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

      apiutil.put(
        '/api/v1/fs/touch/' + encodeURIComponent(p.path) + apiOptions,
        null,
        {
          success: function(xhr) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.touch', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.touch',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          }
        }
      );
    });
  },

  wget: function(path, url, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.wget', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea = p.data_area == 2 ? 'public_data=1' : '';

      var apiOptions = mergeOptions([ optDiskuuid, optDataArea ]);

      apiutil.get(
        '/api/v1/fs/wget/' + encodeURIComponent(p.path) + '/'
                           + encodeURIComponent(url) + apiOptions,
        {
          success: function(xhr) {
            options.onSuccess && options.onSuccess(xhr);
            resolve({ api: 'fs.wget', xhr: xhr });
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.wget',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          }
        }
      );
    });
  },

  grep: function(path, pattern, options = {}) {
    return new Promise(function(resolve, reject) {
      var p = parsePath(path);

      if (!p) {
        options.onError && options.onError(
          { code: 403, message: 'Invalid path' }
        );
        reject({ api: 'fs.grep', code: 403, message: 'Invalid path' });
        return;
      }

      var optDiskuuid  = p.disk_uuid ? 'disk_uuid=' + p.disk_uuid : '';
      var optDataArea  = p.data_area == 2 ? 'public_data=1' : '';
      var optEncoding  = options.encoding ? 'encoding=' + options.encoding : '';
      var optRegexMod  = options.regexModifier
                          ? 'regex_modifier=' + options.regexModifier : '';
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

      apiutil.get(
        '/api/v1/fs/grep/' + encodeURIComponent(p.path) + '/'
                           + encodeURIComponent(pattern) + apiOptions,
        {
          success: function(xhr, data) {
            if (options.testOnly) {
              if (xhr.status == 200) {
                options.onSuccess && options.onSuccess(true);
                resolve({ api: 'fs.grep', result: true });
              }
              else {
                options.onSuccess && options.onSuccess(false);
                resolve({ api: 'fs.grep', result: false });
              }
            }
            else {
              if (xhr.status == 200) {
                options.onSuccess && options.onSuccess(data);
                resolve({ api: 'fs.grep', result: data });
              }
              else {
                options.onSuccess && options.onSuccess();
                resolve({ api: 'fs.grep' });
              }
            }
          },
          error: function(xhr) {
            options.onError && options.onError({
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
            reject({
              api: 'fs.grep',
              code: xhr.status,
              message: xhr.responseText || xhr.statusText
            });
          }
        }
      );
    });
  }
};
