'use strict';

import apiutil from 'lib/utils/apiutil';

function handleError(xhr, api, error, reject) {
  error && error({
    code: xhr.status,
    message: xhr.responseText || xhr.statusText
  });
  reject && reject({
    api: api,
    code: xhr.status,
    message: xhr.responseText || xhr.statusText
  });
}

export default {
  get: function(assetid, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/asset/' + assetid, {
        success: function(xhr, asset) {
          options.onSuccess && options.onSuccess(xhr, asset);
          resolve({ api: 'asset.get', asset: asset });
        },
        error: function(xhr) {
          handleError(xhr, 'asset.get', options.onError, reject);
        }
      });
    });
  },

  add: function(asset, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.post('/api/v1/asset', asset, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'asset.add' });
        },
        error: function(xhr) {
          handleError(xhr, 'asset.add', options.onError, reject);
        }
      });
    });
  },

  update: function(assetid, asset, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/api/v1/asset/' + assetid, asset, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'asset.update' });
        },
        error: function(xhr) {
          handleError(xhr, 'asset.update', options.onError, reject);
        }
      });
    });
  },

  remove: function(assetid, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.delete('/api/v1/asset/' + assetid, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'asset.remove' });
        },
        error: function(xhr) {
          handleError(xhr, 'asset.remove', options.onError, reject);
        }
      });
    });
  }
}
