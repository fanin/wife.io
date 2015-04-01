var NotificationDispatcher = require('../dispatcher/NotificationDispatcher');
var NotificationConstants  = require('../constants/NotificationConstants');

module.exports = {
    add: function(title, text, imageURL, duration, callbacks) {
        NotificationDispatcher.dispatch({
            actionType: NotificationConstants.NOTIFICATION_ADD,
            title:      title,
            text:       text,
            imageURL:   imageURL,
            duration:   duration,
            callbacks:  callbacks
        });
    },

    remove: function(notifyId) {
        NotificationDispatcher.dispatch({
            actionType: NotificationConstants.NOTIFICATION_REMOVE,
            notifyId:   notifyId
        });
    },

    removeAll: function() {
        NotificationDispatcher.dispatch({
            actionType: NotificationConstants.NOTIFICATION_REMOVE_ALL
        });
    }
};
