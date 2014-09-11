var http = require('http').createServer(handler),
    fs = require('fs'),
    path = require('path'),
    ip = require('ip'),
    mime = require('mime'),
    system = require('./system'),
    CoreServer = require('./server/core-server');

http.listen(8001, function() {
    if (!system.server) {
        system.server = new CoreServer(http);
        system.server.listen();
    }
});

try {
    var jsonString = fs.readFileSync(path.resolve(__dirname, 'Settings.json'));
    system.settings = JSON.parse(jsonString);
}
catch (err) {
    console.log('Read Settings.json error: ' + err.toString());
    process.exit(1);
}

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

    if (filename == '/' || filename == '/%SYSNAME%'.toLocaleLowerCase()) {
        // Redirect to launcher
        res.writeHead(301, {
            "location" : 'http://' + req.headers.host + '/apps/launcher/launcher.html'
        });
        res.end();
        return;
    }

    fs.exists(filepath, function(exists) {
        if (!exists) {
            if (path.basename(filename) == 'icon.png') {
                filename = '/resources/img/unknown-icon.png';
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
            var ctype = mime.lookup(filepath);
            res.writeHead(200, {'Content-Type': ctype});

            if (ctype.indexOf('text') > -1 || ctype.indexOf('javascript') > -1) {
                var contentString = content.toString().replace(/%SYSIP%/g, ip.address());
                contentString = contentString.replace(/%SYSNAME%/g, system.settings.SysName);
                contentString = contentString.replace(/%BRAND%/g, system.settings.Brand);
                contentString = contentString.replace(/%COPYRIGHT%/g, system.settings.Copyright);
                res.end(contentString);
            }
            else {
                res.end(content);
            }
        });
    });
}
