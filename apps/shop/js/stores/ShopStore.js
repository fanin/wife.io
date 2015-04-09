var ShopDispatcher = require('../dispatcher/ShopDispatcher');
var ShopConstants  = require('../constants/ShopConstants');
var EventEmitter   = require('events').EventEmitter;
var assign         = require('object-assign');

var CHANGE_EVENT = 'SHOP_STORE_CHANGE';

var ShopStore = assign({}, EventEmitter.prototype, {
    emitChange: function(changes) {
        this.emit(CHANGE_EVENT, changes);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }
});

// Register callback to handle all updates
ShopDispatcher.register(function(action) {
    switch (action.actionType) {
        case ShopConstants.SHOP_APP_INSTALL:
        case ShopConstants.SHOP_APP_STATE_UPLOADING:
        case ShopConstants.SHOP_APP_STATE_INSTALLING:
        case ShopConstants.SHOP_APP_INSTALL_SUCCESS:
        case ShopConstants.SHOP_APP_INSTALL_FAIL:
        case ShopConstants.SHOP_APP_CANCEL_INSTALL:
        case ShopConstants.SHOP_APP_CANCEL_INSTALL_SUCCESS:
        case ShopConstants.SHOP_APP_CANCEL_INSTALL_FAIL:
            ShopStore.emitChange(action);
            break;
    }
});

module.exports = ShopStore;
