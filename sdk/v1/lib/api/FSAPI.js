'use strict';

import apiutil from 'lib/utils/apiutil';

export function FSURLAppRoData(rel) {
  return '@SYSURL/' + rel;
}

export function FSURLUserData(rel) {
  return '@USERURL/' + rel;
}

export function FSURLSharedData(rel) {
  return '@SHURL/' + rel;
}

export function FSURLDiskData(uuid, rel) {
  if (uuid)
    return '@DISKURL' + uuid + '/' + rel;
  else
    return rel;
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
      var blob;

      if (data instanceof Blob)
        blob = data;
      else if (typeof data === 'string')
        blob = new Blob([data], { type: 'text/plain' });
      else
        blob = new Blob([data], { type: 'application/octet-stream' });

      apiutil.upload(
        '/api/v1/fs/file/' + encodeURIComponent(path),
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
      var optEncoding = options.encoding ? 'encoding=' + options.encoding : '';
      var apiOptions = mergeOptions([ 'append=1', optEncoding ]);
      var blob;

      if (data instanceof Blob)
        blob = data;
      else if (typeof data === 'string')
        blob = new Blob([data], { type : 'text/plain' });
      else
        blob = new Blob([data], { type : 'application/octet-stream' });

      apiutil.upload(
        '/api/v1/fs/file/' + encodeURIComponent(path) + apiOptions,
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
      var optEncoding = options.encoding ? 'encoding=' + options.encoding : '';

      var apiOptions = mergeOptions([ optEncoding ]);

      apiutil.get('/api/v1/fs/file/' + encodeURIComponent(path) + apiOptions, {
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
      apiutil.delete('/api/v1/fs/file/' + encodeURIComponent(path), {
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
      var optGetStat  = options.getStat ? 'get_stat=1' : '';
      var apiOptions = mergeOptions([ optGetStat ]);

      apiutil.get('/api/v1/fs/ls/' + encodeURIComponent(path) + apiOptions, {
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
      apiutil.post('/api/v1/fs/mkdir/' + encodeURIComponent(path), null, {
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
      var apiOptions = mergeOptions([ optSymblic ]);

      apiutil.post(
        '/api/v1/fs/ln/' + encodeURIComponent(sourcePath) + '/'
                         + encodeURIComponent(targetPath) + apiOptions,
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
      apiutil.post(
        '/api/v1/fs/mv/' + encodeURIComponent(sourcePath) + '/'
                         + encodeURIComponent(targetPath),
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
      apiutil.post(
        '/api/v1/fs/cp/' + encodeURIComponent(sourcePath) + '/'
                         + encodeURIComponent(targetPath),
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
      apiutil.get('/api/v1/fs/exist/' + encodeURIComponent(path), {
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
      apiutil.get('/api/v1/fs/stat/' + encodeURIComponent(path), {
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
      apiutil.put(
        '/api/v1/fs/touch/' + encodeURIComponent(path),
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
      apiutil.post(
        '/api/v1/fs/wget/' + encodeURIComponent(path) + '/'
                           + encodeURIComponent(url),
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
      var optEncoding  = options.encoding ? 'encoding=' + options.encoding : '';
      var optRegexMod  = options.regexModifier
                          ? 'regex_modifier=' + options.regexModifier : '';
      var optMatchOnly = options.matchOnly ? 'match_only=1' : '';
      var optTestOnly  = options.testOnly ? 'test_only=1' : '';
      var optParseForm = options.parseFormat ? 'parse_format=1' : '';

      var apiOptions = mergeOptions([
        optEncoding,
        optRegexMod,
        optMatchOnly,
        optTestOnly,
        optParseForm
      ]);

      apiutil.get(
        '/api/v1/fs/grep/' + encodeURIComponent(path) + '/'
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
