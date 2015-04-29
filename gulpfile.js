var gulp       = require('gulp'),
    del        = require('del'),
    fse        = require('fs-extra');

try {
    if (process.argv[2] && process.argv[2].indexOf('--device=') === 0)
        global.DEVICE = process.argv[2].split('=')[1].replace('-', '/');
    else
        global.DEVICE = 'xilinx/zynq';

    global.DEBUG          = false;
    global.LIB_PATHS      = [ __dirname + '/lib' ];
    global.BUILD_SETTINGS = fse.readJsonSync('device/' + DEVICE + '/build-settings.json');
    global.BUILD_PATH     = __dirname + '/' + BUILD_SETTINGS.build_dir;
}
catch (error) {
    console.log('Unable to set global variables: ' + error);
    process.exit(-1);
}

require('./server/gulpfile.js');
require('./lib/gulpfile.js');
require('./api/gulpfile.js');
require('./apps/gulpfile.js');
require('./device/gulpfile.js');
require('./resources/gulpfile.js');

var targets = [
    'server',
    'lib',
    'apps',
    'api',
    'device',
    'resources'
];

gulp.task('default', targets, function() {
    console.log('Build succeeded');
});

gulp.task('clean', function(cb) {
    del(BUILD_PATH, cb);
});
