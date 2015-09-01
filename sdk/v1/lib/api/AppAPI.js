'use strict';

import strmsc from 'lib/utils/common/string-misc';
import apiutil from 'lib/utils/apiutil';

export default {
  list: function(callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/apps', {
        success: function(xhr, list) {
          callbacks.onSuccess && callbacks.onSuccess(list);
          resolve({ api: 'app.list', list: list });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: 'Unable to get app list.'
          });
          reject({
            api: 'app.list',
            code: xhr.status,
            message: 'Unable to get app list.'
          });
        }
      });
    });
  },

  install: function(appPkgFile, callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.upload('/api/v1/apps/install', appPkgFile, {
        xhrFields: {
          clientInstallationID: strmsc.uniqueString()
        }
      }, {
        success: function(xhr, instid) {
          callbacks.onReceived && callbacks.onReceived(instid, xhr);
          resolve({ api: 'app.install', instid: instid, xhr: xhr });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          }, xhr);
          reject({
            api: 'app.install',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText,
            xhr: xhr
          });
        },
        progress: function(xhr, progress) {
          callbacks.onProgress && callbacks.onProgress(progress, xhr);
        }
      });
    });
  },

  getInstallStatus: function(instid, callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/apps/install/' + instid, {
        success: function(xhr) {
          callbacks.onSuccess && callbacks.onSuccess({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          resolve({
            api: 'app.getInstallStatus',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          }, xhr);
          reject({
            api: 'app.getInstallStatus',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  abortInstall: function(xhr) {
    apiutil.abort(xhr);
  },

  uninstall: function(manifest, keepUserData, callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.delete(
        '/api/v1/apps/' + manifest.identifier + '?keepUserData=' + (keepUserData ? 1 : 0), {
        success: function(xhr, data) {
          callbacks.onSuccess && callbacks.onSuccess();
          resolve({ api: 'app.uninstall' });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          }, xhr);
          reject({
            api: 'app.uninstall',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  getAppByID: function(appid, callbacks = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/apps/' + appid, {
        success: function(xhr, manifest) {
          callbacks.onSuccess && callbacks.onSuccess(manifest);
          resolve({ api: 'app.getAppByID', manifest: manifest });
        },
        error: function(xhr) {
          callbacks.onError && callbacks.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          }, xhr);
          reject({
            api: 'app.getAppByID',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  getAppType: function(manifest) {
    if (!manifest)
      return '';
    else if (manifest.identifier.indexOf('IA') == 0)
      return 'ia';
    else if (manifest.identifier.indexOf('UA') == 0)
      return 'ua';
    else if (manifest.identifier.indexOf('CA') == 0)
      return 'ca';
  }
};
