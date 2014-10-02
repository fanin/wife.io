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
            success: function () {},
            error: function () {
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

/* Import Socket.IO client library */
include('socket.io/socket.io.js');

/* Import CoreClient object, delegates and data sources */
include('lib/framework/foundation/core/connection-delegate.js');
include('lib/framework/foundation/core/protocol-delegate.js');
include('lib/framework/foundation/core/extension-delegate.js');
include('lib/framework/foundation/core/app-manager-delegate.js');
include('lib/framework/foundation/core/app-manager-datasource.js');
include('lib/framework/foundation/core/storage-delegate.js');
include('lib/framework/foundation/core/storage-datasource.js');
include('lib/framework/foundation/core/core-client.js');

/* Import FileManager object */
include('lib/framework/foundation/filemanager/filemanager.js');
