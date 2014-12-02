var server = require('http').createServer(handler),
    fs = require('fs'),
    path = require('path'),
    ip = require('ip'),
    mime = require('mime');

var jqueryuiPath;
var settingsFile = 'settings.json';
try {
    if (process.argv.length == 3)
        settingsFile = process.argv[2];

    var jsonString = fs.readFileSync(path.resolve(__dirname, settingsFile));

    var SYSTEM = require('./system');
    SYSTEM.SETTINGS = JSON.parse(jsonString);
}
catch (err) {
    console.log('Read ' + settingsFile + ' error: ' + err.toString());
    process.exit(1);
}

server.listen(8001, function() {
    var CoreServer = require('./server/' + SYSTEM.SETTINGS.CoreServer);
    if (!SYSTEM.SERVER) {
        SYSTEM.SERVER = new CoreServer(server);
        SYSTEM.SERVER.listen();
    }
});

setInterval(function() {
    var rss = (process.memoryUsage().rss / (1024 * 1024));
    if (rss > 32) {
        global.gc();
        //console.log("[Force GC] RSS: " + rss.toFixed(2) + "MB");
    }
}, 2000);

// TODO:
//    1. Create ACL to restrict js file requests
//    2. Create route to shorten URL

function handler(req, res) {
    var url = require('url').parse(req.url);
    var filename = url.pathname;
    var filepath = require('path').join(__dirname, filename);

    if (filename === '/' || filename === '/%SYSNAME%'.toLocaleLowerCase()) {
        // Redirect to launcher
        res.writeHead(301, {
            "location" : 'http://' + req.headers.host + '/apps/launcher/launcher.html'
        });
        res.end();
        return;
    }

    if (path.basename(filename) === 'jquery-ui.min.css')
        jqueryuiPath = path.dirname(filename);

    fs.exists(filepath, function(exists) {
        if (!exists) {
            if (path.basename(filename) === 'icon.png') {
                filename = '/resources/img/unknown-icon.png';
                filepath = require('path').join(__dirname, filename);
            }
            else if (path.basename(filename).match(/^ui/) && path.basename(filename).match(/png$/)) {
                /* Rebuild jquery-ui images path */
                filename = jqueryuiPath + '/images/' + path.basename(filename);
                filepath = require('path').join(__dirname, filename);
            }
            else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found\n');
                return;
            }
        }

        if (fs.lstatSync(filepath).isDirectory())
            filepath += 'index.html';

        fs.readFile(filepath, function(err, content) {
            if (err) {
                console.log(err);
                return;
            }

            var ctype = mime.lookup(filepath);
            res.writeHead(200, {'Content-Type': ctype});

            if (ctype.indexOf('text') > -1 || ctype.indexOf('javascript') > -1) {
                var contentString = content.toString().replace(/%SYSIP%/g, ip.address());
                contentString = contentString.replace(/%SYSNAME%/g, SYSTEM.SETTINGS.SysName);
                contentString = contentString.replace(/%BRAND%/g, SYSTEM.SETTINGS.Brand);
                contentString = contentString.replace(/%COPYRIGHT%/g, SYSTEM.SETTINGS.Copyright);
                res.end(contentString);
            }
            else {
                res.end(content);
            }
        });
    });
}
