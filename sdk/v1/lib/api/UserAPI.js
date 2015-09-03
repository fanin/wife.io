'use strict';

import apiutil from 'lib/utils/apiutil';

export default {
  signup: function(user, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.post('/user/signup', user, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.signup' });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'user.signup',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  login: function(user, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.post('/user/login', user, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.login' });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'user.login',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  logout: function(user) {

  }
}
