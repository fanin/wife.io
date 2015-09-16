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

  logout: function(options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/user/logout', {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.logout' });
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
      })
    });
  },

  setPassword: function(password, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/user/password', password, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.setPassword', password: password });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'user.setPassword',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  },

  getProfile: function(options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/user/profile', {
        success: function(xhr, user) {
          options.onSuccess && options.onSuccess(user);
          resolve({ api: 'user.getProfile', user: user });
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

  setProfile: function(profile, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/user/profile', profile, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.setProfile', profile: profile });
        },
        error: function(xhr) {
          options.onError && options.onError({
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
          reject({
            api: 'user.setProfile',
            code: xhr.status,
            message: xhr.responseText || xhr.statusText
          });
        }
      });
    });
  }
}
