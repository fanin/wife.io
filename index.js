var server = require('http').createServer(handler),
    fs = require('fs'),
    path = require('path');

var settingsFile = 'settings.json';
try {
    if (process.argv.length == 3)
        settingsFile = process.argv[2];

    var jsonString = fs.readFileSync(path.resolve(__dirname, settingsFile));

    var SYSTEM = require('./system');
    SYSTEM.SETTINGS = JSON.parse(jsonString);

    /* Set default settings if needed */
    if (!SYSTEM.SETTINGS.CoreServer) SYSTEM.SETTINGS.CoreServer = "core-server";
    if (!SYSTEM.SETTINGS.UserStorageMountpoint) SYSTEM.SETTINGS.UserStorageMountpoint = "/home";
    if (!SYSTEM.SETTINGS.TempPath) SYSTEM.SETTINGS.TempPath = "/tmp";
}
catch (err) {
    console.log('Read ' + settingsFile + ' error: ' + err.toString());
    process.exit(1);
}

server.listen(process.env.npm_package_config_port || 8001, function() {
    var CoreServer = require('./server/' + SYSTEM.SETTINGS.CoreServer);
    if (!SYSTEM.SERVER) {
        SYSTEM.SERVER = new CoreServer(server);
        SYSTEM.SERVER.listen();
    }
});

if (global.gc) {
    setInterval(function() {
        var rss = (process.memoryUsage().rss / (1024 * 1024));
        if (rss > 32) {
            global.gc();
            //console.log("[Force GC] RSS: " + rss.toFixed(2) + "MB");
        }
    }, 2000);
}

function handler(req, res) {
    if (SYSTEM.SERVER)
        SYSTEM.SERVER.handleRequest(req, res);
}
