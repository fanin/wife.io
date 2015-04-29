var http   = require('http').createServer(handler);
var fs     = require('fs');
var path   = require('path');
var SYSTEM = require('./system');

var settingsFile = 'server-settings.json';

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
if (!SYSTEM.SETTINGS.server)
    SYSTEM.SETTINGS.server = 'diligent-server';

if (!SYSTEM.SETTINGS.sys_data_path)
    throw new Error('Missing system setting "sys_data_path" in the settings.json');

if (!SYSTEM.SETTINGS.temp_data_path)
    SYSTEM.SETTINGS.temp_data_path = '/tmp';

/* Set process name */
process.title = SYSTEM.SETTINGS.sys_name;

http.listen(SYSTEM.SETTINGS.port || 8001, function() {
    var Server = require(path.resolve(__dirname, SYSTEM.SETTINGS.server));
    if (!SYSTEM.SERVER) {
        SYSTEM.SERVER = new Server(http);
        SYSTEM.SERVER.listen();
    }
});

if (global.gc) {
    setInterval(function() {
        var rss = (process.memoryUsage().rss / (1024 * 1024));
        if (rss > 32) {
            global.gc();
            //console.log('[Force GC] RSS: ' + rss.toFixed(2) + 'MB');
        }
    }, 2000);
}

function handler(req, res) {
    if (SYSTEM.SERVER)
        SYSTEM.SERVER.handleRequest(req, res);
}
