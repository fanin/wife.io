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

/* Import Socket.IO client library */
include('socket.io/socket.io.js');

/* Import JQuery UI library */
include('lib/jquery/ui/1.11.1/themes/ui-lightness/jquery-ui.min.css');
include('lib/jquery/ui/1.11.1/jquery-ui.min.js');

/* Import CoreClient object */
include('lib/framework/foundation/core/core-client.js');
include('lib/framework/foundation/core/core-client-delegate.js');

/* Import FileManager object */
include('lib/framework/foundation/filemanager/filemanager.js');
