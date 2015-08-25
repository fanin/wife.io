var ShopDispatcher = require('../dispatcher/ShopDispatcher');
var ShopConstants  = require('../constants/ShopConstants');
var EventEmitter   = require('events').EventEmitter;
var assign         = require('object-assign');

var CHANGE_EVENT = 'SHOP_STORE_CHANGE';
var CLEAN_EVENT = 'SHOP_STORE_CLEAN';

var _installers = [];

var ShopStore = assign({}, EventEmitter.prototype, {
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  emitClean: function() {
    this.emit(CLEAN_EVENT);
  },

  addCleanListener: function(callback) {
    this.on(CLEAN_EVENT, callback);
  },

  removeCleanListener: function(callback) {
    this.removeListener(CLEAN_EVENT, callback);
  },

  getInstallers: function() {
    return _installers;
  },

  getInstaller: function(xhr) {
    if (xhr && xhr.clientInstallationID)
      return _installers[xhr.clientInstallationID];
    else
      return null;
  }
});

ShopStore.setMaxListeners(100);

ShopDispatcher.register(function(action) {
  var index = action.xhr.clientInstallationID;

  switch (action.actionType) {
    case ShopConstants.SHOP_APP_PKG_UPLOAD_PROGRESS:
      _installers[index] = { status: 'uploading', progress: action.progress };
      ShopStore.emitChange();
      break;
    case ShopConstants.SHOP_APP_PKG_INSTALL_ERROR:
      if (_installers[index]) {
        _installers[index].status = 'error';
        _installers[index].error = { code: action.code, message: action.message };
        ShopStore.emitChange();
      }
      break;
    case ShopConstants.SHOP_APP_PKG_INSTALLING:
      if (_installers[index]) {
        _installers[index].serverInstallationID = action.xhr.serverInstallationID;
        _installers[index].progress = 100;
        _installers[index].status = 'installing';
        ShopStore.emitChange();
      }
      break;
    case ShopConstants.SHOP_APP_PKG_INSTALLED:
      if (_installers[index]) {
        _installers[index].serverInstallationID = action.xhr.serverInstallationID;
        _installers[index].status = 'installed';
        ShopStore.emitChange();
      }
      break;
    case ShopConstants.SHOP_APP_PKG_UPGRADED:
      if (_installers[index]) {
        _installers[index].serverInstallationID = action.xhr.serverInstallationID;
        _installers[index].progress = 100;
        _installers[index].status = 'upgraded';
        ShopStore.emitChange();
      }
      break;
    case ShopConstants.SHOP_APP_PKG_ABORT_INSTALL:
      if (_installers[index] && _installers[index].progress < 100) {
        _installers[index].status = 'aborted';
        ShopStore.emitChange();
      }
      break;
    case ShopConstants.SHOP_APP_PKG_REMOVE_INSTALL:
      if (_installers[index]) {
        delete _installers[index]
        ShopStore.emitClean();
      }
      break;
  }
});

module.exports = ShopStore;
