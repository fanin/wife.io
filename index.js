var server = require('http').createServer(handler),
    fs = require('fs'),
    path = require('path');

var SYSTEM = require('./system');
var settingsFile = 'settings.json';

try {
    if (process.argv.length == 3)
        settingsFile = process.argv[2];

    var jsonString = fs.readFileSync(path.resolve(__dirname, settingsFile));

    SYSTEM.SETTINGS = JSON.parse(jsonString);
}
catch (err) {
    console.log('Read ' + settingsFile + ' error: ' + err.toString());
    process.exit(1);
}

/* Set default settings if needed */
if (!SYSTEM.SETTINGS.DiligentServer) SYSTEM.SETTINGS.DiligentServer = "diligent-server";
if (!SYSTEM.SETTINGS.SystemDataPath) throw new Error('Missing system setting "SystemDataPath" in the settings.json');
if (!SYSTEM.SETTINGS.TempPath) SYSTEM.SETTINGS.TempPath = "/tmp";

server.listen(process.env.npm_package_config_port || 8001, function() {
    var DiligentServer = require('./server/' + SYSTEM.SETTINGS.DiligentServer);
    if (!SYSTEM.SERVER) {
        SYSTEM.SERVER = new DiligentServer(server);
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
