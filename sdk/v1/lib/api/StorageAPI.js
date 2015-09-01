'use strict';

import apiutil from 'lib/utils/apiutil';

export default {
  list: function(callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/storage', {
        success: function(xhr, disks) {
          callbacks.onSuccess && callbacks.onSuccess(disks);
          resolve({ api: 'storage.list', disks: disks });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'storage.list',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  getDisk: function(uuid, callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/storage/' + uuid, {
        success: function(xhr, disk) {
          callbacks.onSuccess && callbacks.onSuccess(disk);
          resolve({ api: 'storage.getDisk', disk: disk });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'storage.getDisk',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  onDiskEvent: function(callback = {}) {
    apiutil.on('/api/v1/storage/sse', callback);
  }
};
