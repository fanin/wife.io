var gulp = require('gulp'),
    del  = require('del'),
    fs   = require('fs'),
    fse  = require('fs-extra'),
    os   = require('os'),
    util = require('util');

del.sync('.sublime-gulp.cache');

var targets = [];

if (fs.existsSync('.build-device')) {
    addBuildTargets();
}
else {
    addDeviceTargets();
}

function addBuildTargets() {
    global.DEVICE          = fs.readFileSync('.build-device', 'ascii').split(os.EOL)[0];
    global.DEBUG           = true;
    global.SDK_PATH        = [ __dirname + '/sdk' ];
    global.SERVER_SETTINGS = fse.readJsonSync('device/' + DEVICE + '/server-settings.json');
    global.BUILD_SETTINGS  = fse.readJsonSync('device/' + DEVICE + '/build-settings.json');
    global.BUILD_PATH      = __dirname + '/' + BUILD_SETTINGS.build_dir;

    var RunStopScript = util.format(
            'case "$1" in' + os.EOL +
            '    run)' + os.EOL +
            '        echo Running %s...; ' + os.EOL +
            '        killall %s 2>/dev/null; ' + os.EOL +
            '        [ ! -e %s ] && echo Please build %s first \\' + os.EOL +
            '                    || (cd %s; npm start)' + os.EOL +
            '        ;;' + os.EOL +
            '    stop)' + os.EOL +
            '        echo Stopping %s...; ' + os.EOL +
            '        killall %s' + os.EOL +
            '        ;;' + os.EOL +
            '    *)' + os.EOL +
            'esac' + os.EOL,
            global.SERVER_SETTINGS.sys_name,
            global.SERVER_SETTINGS.sys_name,
            global.BUILD_PATH,
            global.SERVER_SETTINGS.sys_name,
            global.BUILD_PATH,
            global.SERVER_SETTINGS.sys_name,
            global.SERVER_SETTINGS.sys_name
        );

    fs.writeFileSync('.build-runstop.sh', RunStopScript, 'ascii');

    targets = [
        'server',
        'sdk',
        'apps',
        'device',
        'public'
    ];

    require('./server/gulpfile.js');
    require('./sdk/gulpfile.js');
    require('./apps/gulpfile.js');
    require('./device/gulpfile.js');
    require('./public/gulpfile.js');

    gulp.task('default', targets, function() {
        console.log('Build succeeded');
    });

    gulp.task('clean', function(cb) {
        del(global.BUILD_PATH, cb);
    });

    gulp.task('distclean', function(cb) {
        del.sync('.build-device');
        del.sync('.build-runstop.sh');
        del(global.BUILD_PATH, cb);
    });
}

function addDeviceTargets() {
    var venders = fs.readdirSync('device/');

    for (var i in venders) {
        if (fs.lstatSync('device/' + venders[i]).isDirectory()) {
            var platforms = fs.readdirSync('device/' + venders[i]);
            for (var j in platforms) {
                if (fs.lstatSync('device/' + venders[i] + '/' + platforms[j]).isDirectory()) {
                    var deviceTarget = venders[i] + '/' + platforms[j];

                    if (deviceTarget === 'generic/common')
                        targets.unshift(deviceTarget);
                    else
                        targets.push(deviceTarget);
                }
            }
        }
    }

    function addTask(name) {
        gulp.task(name, function() {
            console.log(os.EOL + 'You choose ' + name + os.EOL);
            fs.writeFileSync('.build-device', name, 'ascii');
        });
    }

    for (i in targets) {
        addTask(targets[i]);
    }

    console.log(os.EOL + 'Please choose a target device by running "gulp DEVICE_NAME",');
    console.log('or press "Alt + B" to show device list in Sublime Text.' + os.EOL);
    console.log('Device Support List');
    console.log('------------------------------');
    for (var i in targets)
        console.log(' ' + i + ': ' + targets[i]);
    console.log('------------------------------' + os.EOL);
}
