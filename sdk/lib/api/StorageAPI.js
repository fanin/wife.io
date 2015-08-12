'use strict';

var apiutil = require('lib/utils/apiutil');

module.exports = {
    list: function(callbacks) {
        apiutil.get('/api/v1/storage', {
            success: function(xhr, disks) {
                callbacks.onSuccess && callbacks.onSuccess(disks);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    getDisk: function(uuid, callbacks) {
        apiutil.get('/api/v1/storage/' + uuid, {
            success: function(xhr, disk) {
                callbacks.onSuccess && callbacks.onSuccess(disk);
            },
            error: function(xhr) {
                callbacks.onError && callbacks.onError({ code: xhr.status, message: xhr.responseText || xhr.statusText });
            }
        });
    },

    onDiskEvent: function(callback) {
        apiutil.on('/api/v1/storage/sse', callback);
    }
};
