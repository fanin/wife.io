var BASEPATH = '/';

module.exports = {
    include: function(url) {
        var ext = url.split('.').pop();

        url = BASEPATH + url;

        if (ext === 'js') {
            $.ajax({
                url: url,
                dataType: 'script',
                async: true,
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
                async: true,
                success: function(data) {
                    $('<style type="text/css">\n' + data + '</style>').appendTo('head');
                }
            });
        }
    }
}
