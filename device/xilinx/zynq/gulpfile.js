var gulp = require('gulp'),
    exec = require('child_process').exec;

gulp.task('device/xilinx/zynq', function(cb) {
    console.log('[device/xilinx/zynq] Building zynq-memchr-fix...');
    var child = exec('cd ' + __dirname + '/zynq-memchr-fix && make', function (error, stdout, stderr) {
        if (error) {
            console.log('[device/xilinx/zynq] Build zynq-memchr-fix failed: ' + error);
            cb(error);
        }
        else {
            gulp.src([ __dirname + '/zynq-memchr-fix/memchr.so' ])
                .pipe(gulp.dest(global.BUILD_PATH + '/device/xilinx/zynq/zynq-memchr-fix'));

            console.log('[device/xilinx/zynq] Build zynq-memchr-fix succeeded');
            cb();
        }
    });
});

gulp.task('default', [ 'device/xilinx/zynq' ]);
