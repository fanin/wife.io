if (global.gc) {
    setInterval(function() {
        var rss = (process.memoryUsage().rss / (1024 * 1024));
        if (rss > 32) {
            global.gc();
            //console.log('[Force GC] RSS: ' + rss.toFixed(2) + 'MB');
        }
    }, 2000);
}

require('./config');
require('./server');
