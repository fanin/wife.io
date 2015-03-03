var NotificationDispatcher = require('../dispatcher/NotificationDispatcher');
var NotificationConstants  = require('../constants/NotificationConstants');
var EventEmitter           = require('events').EventEmitter;
var assign                 = require('object-assign');

var notificationAction;

var NotificationStore = assign({}, EventEmitter.prototype, {
    /**
     * Emit diligent client changes
     */
    emitNotificationChange: function() {
        this.emit(NotificationConstants.NOTIFICATION_EVENT);
    },

    /**
     * @param {function} callback
     */
    addNotificationListener: function(callback) {
        this.on(NotificationConstants.NOTIFICATION_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeNotificationListener: function(callback) {
        this.removeListener(NotificationConstants.NOTIFICATION_EVENT, callback);
    },

    /**
     * Get notification action
     */
    getAction: function() {
        return notificationAction;
    }
});

NotificationDispatcher.register(function(action) {
    switch(action.actionType) {
        case NotificationConstants.NOTIFICATION_ADD:
        case NotificationConstants.NOTIFICATION_REMOVE:
        case NotificationConstants.NOTIFICATION_REMOVE_ALL:
            notificationAction = action;
            NotificationStore.emitNotificationChange();
            break;
    }
});

module.exports = NotificationStore;
