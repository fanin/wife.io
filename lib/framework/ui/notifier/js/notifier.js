include('lib/jquery/plugins/gritter/css/jquery.gritter.css');
include('lib/jquery/plugins/gritter/js/jquery.gritter.min.js');

function Notifier() {}

Notifier.prototype.add = function(title, text, imageURL, duration, callbacks) {
    return $.gritter.add({
        // (string | mandatory) the heading of the notification
        title: title,
        // (string | mandatory) the text inside the notification
        text: text,
        // (string | optional) the image to display on the left
        image: imageURL,
        // (bool | optional) if you want it to fade out on its own or just sit there
        sticky: (duration > 0) ? false : true,
        // (int | optional) the time you want it to be alive for before fading out (milliseconds)
        time: duration,
        // (string | optional) the class name you want to apply directly to the notification for custom styling
        class_name: 'notifier',
        // (function | optional) function called before it opens
        before_open: function(){
            if (callbacks && callbacks.beforeOpen)
                callbacks.beforeOpen();
        },
        // (function | optional) function called after it opens
        after_open: function(e){
            if (callbacks && callbacks.afterOpen)
                callbacks.afterOpen();
        },
        // (function | optional) function called before it closes
        before_close: function(e, manual_close){
            if (callbacks && callbacks.beforeClose)
                callbacks.beforeClose(manual_close);
        },
        // (function | optional) function called after it closes
        after_close: function(){
            if (callbacks && callbacks.afterClose)
                callbacks.afterClose();
        }
    });
}

Notifier.prototype.remove = function(notifid) {
    $.gritter.remove(notifid, {
        fade: true, // optional
        speed: 'fast' // optional
    });
}

Notifier.prototype.removeAll = function() {
    $.gritter.removeAll();
}
