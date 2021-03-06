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
  admGetList: function(options = {}) {
    return new Promise(function(resolve, reject) {
      let url = '/api/v1/user/adm/list?k=0';

      if (options.searches)
        url += '&searches=' + encodeURIComponent(options.searches);

      if (options.page)
        url += '&page=' + options.page;

      if (options.limit)
          url += '&limit=' + options.limit;

      apiutil.get(url, {
        success: function(xhr, result) {
          options.onSuccess && options.onSuccess(xhr, result);
          resolve({ api: 'user.admGetList', users: result.users, count: result.count });
        },
        error: function(xhr) {
          handleError(xhr, 'user.admGetList', options.onError, reject);
        }
      });
    });
  },

  admSetProfile: function(profileForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/api/v1/user/adm/profile', profileForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.admSetProfile', form: profileForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.admSetProfile', options.onError, reject);
        }
      });
    });
  },

  admDeactivate: function(email, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.delete('/api/v1/user/adm/profile?email=' + encodeURIComponent(email)
                     + '&delete=' + (+!!options.delete), {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.admDeactivate' });
        },
        error: function(xhr) {
          handleError(xhr, 'user.admDeactivate', options.onError, reject);
        }
      });
    });
  },

  signup: function(userForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.post('/api/v1/user/signup', userForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.signup', form: userForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.signup', options.onError, reject);
        }
      });
    });
  },

  deactivate: function(options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.delete('/api/v1/user/profile', {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.deactivate' });
        },
        error: function(xhr) {
          handleError(xhr, 'user.deactivate', options.onError, reject);
        }
      });
    });
  },

  login: function(userForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.post('/api/v1/user/login', userForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.login', form: userForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.login', options.onError, reject);
        }
      });
    });
  },

  logout: function(options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.get('/api/v1/user/logout', {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.logout' });
        },
        error: function(xhr) {
          handleError(xhr, 'user.logout', options.onError, reject);
        }
      })
    });
  },

  setPassword: function(passwordForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/api/v1/user/password', passwordForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.setPassword', form: passwordForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.setPassword', options.onError, reject);
        }
      });
    });
  },

  getProfile: function(options = {}) {
    return new Promise(function(resolve, reject) {
      let url = '/api/v1/user/profile';

      if (options.user)
        url += '?email=' + encodeURIComponent(options.user);

      apiutil.get(url, {
        success: function(xhr, user) {
          options.onSuccess && options.onSuccess(xhr, user);
          resolve({ api: 'user.getProfile', user: user, users: user });
        },
        error: function(xhr) {
          handleError(xhr, 'user.getProfile', options.onError, reject);
        }
      });
    });
  },

  setProfile: function(profileForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/api/v1/user/profile', profileForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.setProfile', form: profileForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.setProfile', options.onError, reject);
        }
      });
    });
  },

  userCount: function(options = {}) {
    return new Promise(function(resolve, reject) {
      let url = '/api/v1/user/count';

      if (options.searches)
        url += '?searches=' + encodeURIComponent(options.searches);

      apiutil.get(url, {
        success: function(xhr, result) {
          options.onSuccess && options.onSuccess(xhr, result.count);
          resolve({ api: 'user.userCount', count: result.count });
        },
        error: function(xhr) {
          handleError(xhr, 'user.userCount', options.onError, reject);
        }
      });
    });
  },

  getGroups: function(options = {}) {
    let url = '/api/v1/group?k=0';

    if (options.searches)
      url += '&searches=' + encodeURIComponent(options.searches);

    if (options.page)
      url += '&page=' + options.page;

    if (options.limit)
        url += '&limit=' + options.limit;

    return new Promise(function(resolve, reject) {
      apiutil.get(url, {
        success: function(xhr, result) {
          options.onSuccess && options.onSuccess(xhr, result.groups);
          resolve({ api: 'user.getGroups', groups: result.groups, count: result.count });
        },
        error: function(xhr) {
          handleError(xhr, 'user.getGroups', options.onError, reject);
        }
      });
    });
  },

  addGroup: function(groupCreateForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.post('/api/v1/group', groupCreateForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.addGroup', form: groupCreateForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.addGroup', options.onError, reject);
        }
      });
    });
  },

  renameGroup: function(groupModifyForm, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.put('/api/v1/group', groupModifyForm, {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.renameGroup', form: groupModifyForm });
        },
        error: function(xhr) {
          handleError(xhr, 'user.renameGroup', options.onError, reject);
        }
      });
    });
  },

  removeGroup: function(name, options = {}) {
    return new Promise(function(resolve, reject) {
      apiutil.delete([ '/api/v1/group', name ].join('/'), {
        success: function(xhr) {
          options.onSuccess && options.onSuccess(xhr);
          resolve({ api: 'user.removeGroup', name: name });
        },
        error: function(xhr) {
          handleError(xhr, 'user.removeGroup', options.onError, reject);
        }
      });
    });
  },

  groupCount: function(options = {}) {
    return new Promise(function(resolve, reject) {
      let url = '/api/v1/group/count?k=0';

      if (options.searches)
        url += '&searches=' + encodeURIComponent(options.searches);

      if (options.page)
        url += '&page=' + options.page;

      if (options.limit)
          url += '&limit=' + options.limit;

      apiutil.get(url, {
        success: function(xhr, result) {
          options.onSuccess && options.onSuccess(xhr, result.count);
          resolve({ api: 'user.groupCount', count: result.count });
        },
        error: function(xhr) {
          handleError(xhr, 'user.groupCount', options.onError, reject);
        }
      });
    });
  },
}
