'use strict';

var strmsc = require('lib/utils/common/string-misc');
var apiutil = require('lib/utils/apiutil');

module.exports = {
  list: function(callbacks) {
    callbacks = callbacks || {};
    apiutil.get('/api/v1/apps', {
      success: function(xhr, list) {
        callbacks.onSuccess && callbacks.onSuccess(list);
      },
      error: function(xhr) {
        callbacks.onError && callbacks.onError({
          code: xhr.status,
          message: 'Unable to get app list.'
        });
      }
    });
  },

  install: function(appPkgFile, callbacks) {
    callbacks = callbacks || {};
    apiutil.upload('/api/v1/apps/install', appPkgFile, {
      xhrFields: {
        clientInstallationID: strmsc.uniqueString()
      }
    }, {
      success: function(xhr, instid) {
        callbacks.onReceived && callbacks.onReceived(instid, xhr);
      },
      error: function(xhr) {
        callbacks.onError && callbacks.onError({
          code: xhr.status,
          message: xhr.responseText || xhr.statusText
        }, xhr);
      },
      progress: function(xhr, progress) {
        callbacks.onProgress && callbacks.onProgress(progress, xhr);
      }
    });
  },

  getInstallStatus: function(instid, callbacks) {
    callbacks = callbacks || {};
    apiutil.get('/api/v1/apps/install/' + instid, {
      success: function(xhr) {
        callbacks.onSuccess && callbacks.onSuccess({
          code: xhr.status,
          message: xhr.responseText || xhr.statusText
        });
      },
      error: function(xhr) {
        callbacks.onError && callbacks.onError({
          code: xhr.status,
          message: xhr.responseText || xhr.statusText
        }, xhr);
      }
    });
  },

  abortInstall: function(xhr) {
    apiutil.abort(xhr);
  },

  uninstall: function(manifest, keepUserData, callbacks) {
    callbacks = callbacks || {};
    apiutil.delete(
      '/api/v1/apps/' + manifest.identifier + '?keepUserData=' + (keepUserData ? 1 : 0), {
      success: function(xhr, data) {
        callbacks.onSuccess && callbacks.onSuccess();
      },
      error: function(xhr) {
        callbacks.onError && callbacks.onError({
          code: xhr.status,
          message: xhr.responseText || xhr.statusText
        }, xhr);
      }
    });
  },

  getAppByID: function(appid, callbacks) {
    callbacks = callbacks || {};
    apiutil.get('/api/v1/apps/' + appid, {
      success: function(xhr, manifest) {
        callbacks.onSuccess && callbacks.onSuccess(manifest);
      },
      error: function(xhr) {
        callbacks.onError && callbacks.onError({
          code: xhr.status,
          message: xhr.responseText || xhr.statusText
        }, xhr);
      }
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
