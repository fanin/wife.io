var BASEPATH = '%PROTO%://%SYSIP%:%SYSPORT%/';

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
    },

    basename: function(path) {
        return path.replace(/\\/g,'/').replace(/.*\//, '');
    },

    dirname: function(path) {
        return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
    },

    base64ToBlob: function(base64str, contentType) {
        var blob;
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
            blob = new Blob([view], { type: contentType });
        }
        catch (error) {
            blob = new Blob([]);
        }

        return blob;
    },

    getTimecode: function() {
        var now = new Date();
        return now.getFullYear()
                + ("0" + (now.getMonth() + 1)).slice(-2)
                + ("0" + now.getDate()).slice(-2)
                + ("0" + now.getHours()).slice(-2)
                + ("0" + now.getMinutes()).slice(-2)
                + ("0" + now.getSeconds()).slice(-2)
                + ("0" + now.getMilliseconds()).slice(-2);
    },

    getRandomValue: function(digit) {
        return ("0" + Math.floor(Math.random() * Math.pow(10, digit))).slice(-digit);
    },

    generateUID: function() {
        return this.getTimecode() + this.getRandomValue(4);
    }
}
