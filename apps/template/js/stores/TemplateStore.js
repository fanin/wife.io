var $TEMPLATE$Dispatcher = require('../dispatcher/$TEMPLATE$Dispatcher');
var $TEMPLATE$Constants  = require('../constants/$TEMPLATE$Constants');
var EventEmitter         = require('events').EventEmitter;
var assign               = require('object-assign');

var CHANGE_EVENT = '$$TEMPLATE$$_STORE_CHANGE';

var $TEMPLATE$Store = assign({}, EventEmitter.prototype, {
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
$TEMPLATE$Dispatcher.register(function(action) {
    switch (action.actionType) {
        default:
            break;
    }
});

module.exports = $TEMPLATE$Store;
