var AppAPI         = require('lib/api/AppAPI');
var ShopDispatcher = require('../dispatcher/ShopDispatcher');
var ShopConstants  = require('../constants/ShopConstants');

var ShopActionCreators = {

  install: function(file) {
    AppAPI.install(file, {
      onReceived: function(instid, xhr) {
        file.xhr.serverInstallationID = instid;
        file.xhr.checkTimer = setInterval(function() {
          AppAPI.getInstallStatus(instid, {
            onSuccess: function(status) {
              if (status.code === 202)
                ShopDispatcher.dispatch({
                  actionType: ShopConstants.SHOP_APP_PKG_INSTALLING,
                  xhr: file.xhr
                });
              else if (status.message === 'Install OK')
                ShopDispatcher.dispatch({
                  actionType: ShopConstants.SHOP_APP_PKG_INSTALLED,
                  xhr: file.xhr
                });
              else if (status.message === 'Upgrade OK')
                ShopDispatcher.dispatch({
                  actionType: ShopConstants.SHOP_APP_PKG_UPGRADED,
                  xhr: file.xhr
                });

              if (status.code === 200)
                clearInterval(file.xhr.checkTimer);
            },

            onError: function(error, xhr) {
              clearInterval(file.xhr.checkTimer);

              ShopDispatcher.dispatch({
                actionType: ShopConstants.SHOP_APP_PKG_INSTALL_ERROR,
                xhr: file.xhr,
                code: error.code,
                message: error.message
              });
            }
          });
        }, 500);
      },
      onProgress: function(progress, xhr) {
        file.xhr = xhr;
        file.xhr.progress = progress;

        ShopDispatcher.dispatch({
          actionType: ShopConstants.SHOP_APP_PKG_UPLOAD_PROGRESS,
          xhr: file.xhr,
          progress: progress
        });
      },
      onError: function(error, xhr) {
        ShopDispatcher.dispatch({
          actionType: ShopConstants.SHOP_APP_PKG_INSTALL_ERROR,
          xhr: xhr,
          code: error.code,
          message: error.message
        });
      }
    });
  },

  abortInstall: function(xhr) {
    if (!xhr.progress || xhr.progress < 100) {
      clearInterval(xhr.checkTimer);
      AppAPI.abortInstall(xhr);

      ShopDispatcher.dispatch({
        actionType: ShopConstants.SHOP_APP_PKG_ABORT_INSTALL,
        xhr: xhr
      });
    }
  },

  removeInstall: function(xhr) {
    ShopDispatcher.dispatch({
      actionType: ShopConstants.SHOP_APP_PKG_REMOVE_INSTALL,
      xhr: xhr
    });
  }
}

module.exports = ShopActionCreators;
