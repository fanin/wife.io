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
  get: function(options = {}) {
    return new Promise(function(resolve, reject) {
      let url = '/api/v1/asset?k=0';

      if (options.assetid) {
        url += '&assetid=' + encodeURIComponent(options.assetid);
      }
      else {
        if (options.searches)
          url += '&searches=' + encodeURIComponent(options.searches);

        if (options.page)
          url += '&page=' + options.page;

        if (options.limit)
          url += '&limit=' + options.limit;
      }

      apiutil.get(url, {
        success: function(xhr, result) {
          options.onSuccess && options.onSuccess(xhr, result);
          resolve({ api: 'asset.get', assets: result.assets, count: result.count });
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
