'use strict';

var NotificationDispatcher     = require('../dispatcher/NotificationDispatcher');
var NotificationConstants      = require('../constants/NotificationConstants');
var NotificationActionCreators = require('../actions/NotificationActionCreators');
var NotificationStore          = require('../stores/NotificationStore');

var NotificationController = {
    actions: NotificationActionCreators,
    notifyId: null,

    init: function() {
        NotificationStore.addNotificationListener(this._onNotificationEvent);
    },

    deinit: function() {
        NotificationStore.removeNotificationListener(this._onNotificationEvent);
    },

    _onNotificationEvent: function() {
        var action = NotificationStore.getAction();

        if (action) {
            switch(action.actionType) {
                case NotificationConstants.NOTIFICATION_ADD:
                    this.notifyId = $.gritter.add({
                        // (string | mandatory) the heading of the notification
                        title: action.title,
                        // (string | mandatory) the text inside the notification
                        text: action.text,
                        // (string | optional) the image to display on the left
                        image: action.imageURL,
                        // (bool | optional) if you want it to fade out on its own or just sit there
                        sticky: (action.duration > 0) ? false : true,
                        // (int | optional) the time you want it to be alive for before fading out (milliseconds)
                        time: action.duration,
                        // (string | optional) the class name you want to apply directly to the notification for custom styling
                        class_name: null,
                        // (function | optional) function called before it opens
                        before_open: function(){
                            if (action.callbacks && action.callbacks.beforeOpen)
                                action.callbacks.beforeOpen();
                        },
                        // (function | optional) function called after it opens
                        after_open: function(e){
                            if (action.callbacks && action.callbacks.afterOpen)
                                action.callbacks.afterOpen();
                        },
                        // (function | optional) function called before it closes
                        before_close: function(e, manual_close){
                            if (action.callbacks && action.callbacks.beforeClose)
                                action.callbacks.beforeClose(manual_close);
                        },
                        // (function | optional) function called after it closes
                        after_close: function(){
                            if (action.callbacks && action.callbacks.afterClose)
                                action.callbacks.afterClose();
                            this.notifyId = null;
                        }
                    });
                    break;

                case NotificationConstants.NOTIFICATION_REMOVE:
                    $.gritter.remove(action.notifyId, {
                        fade: true, // optional
                        speed: 'fast' // optional
                    });
                    break;

                case NotificationConstants.NOTIFICATION_REMOVE_ALL:
                    $.gritter.removeAll();
                    break;
            }
        }
    }
};

module.exports = NotificationController;
