var BASEPATH = 'http://%SYSIP%:8001/';

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

/* Import Socket.IO client library */
include('socket.io/socket.io.js');

/* Import client objects, delegates and data sources */
include('lib/framework/foundation/extension/extension-delegate.js');
include('lib/framework/foundation/extension/extension-client.js');
include('lib/framework/foundation/app/app-manager-delegate.js');
include('lib/framework/foundation/app/app-manager-client.js');
include('lib/framework/foundation/storage/storage-delegate.js');
include('lib/framework/foundation/storage/storage-client.js');
include('lib/framework/foundation/fs/file-manager-client.js');

include('lib/framework/foundation/core/connection-delegate.js');
include('lib/framework/foundation/core/protocol-delegate.js');
include('lib/framework/foundation/core/core-client.js');
