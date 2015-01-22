var BASEPATH = 'http://%SYSIP%:%SYSPORT%/';

function include(url)
{
    var ext = url.split('.').pop();

    url = BASEPATH + url;

    if (ext === 'js') {
        $.ajax({
            url: url,
            dataType: 'script',
            async: false,
            success: function(data) {},
            error: function(error) {
                throw new Error('Could not load script ' + url);
            }
        });
    }
    else if (ext === 'css') {
        $.ajax({
            url: url,
            dataType: 'text',
            async: false,
            success: function(data) {
                $('<style type="text/css">\n' + data + '</style>').appendTo('head');
            }
        });
    }
}

function extend(destination, source) {
    for (var k in source) {
        if (source.hasOwnProperty(k)) {
            destination[k] = source[k];
        }
    }
    return destination;
}

function basename(path) {
    return path.replace(/\\/g,'/').replace(/.*\//, '');
}

function dirname(path) {
    return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
}

function base64ToBlob(base64str, contentType) {
    try {
        // decode base64 string, remove space for IE compatibility
        var binary = atob(base64str.replace(/\s/g, ''));

        // get binary length
        var len = binary.length;

        // create ArrayBuffer with binary length
        var buffer = new ArrayBuffer(len);

        // create 8-bit Array
        var view = new Uint8Array(buffer);

        // save unicode of binary data into 8-bit Array
        for (var i = 0; i < len; i++) {
            view[i] = binary.charCodeAt(i);
        }

        // create the blob object with content-type
        var blob = new Blob([view], { type: contentType });
    }
    catch (error) {
        var blob = new Blob([]);
    }

    return blob;
}

/* Implement event emitter by JQuery */
function Event() {}
Event.prototype.event = $('<div></div>');

/* Import Socket.IO client & Emitter api */
include('socket.io/socket.io.js');
