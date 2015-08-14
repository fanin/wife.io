var gulp = require('gulp'),
    fs   = require('fs');

require('./lib/gulpfile');

var targets = [ 'sdk/lib', 'sdk/tools', 'sdk/versionsversions' ];

gulp.task('sdk/tools', function() {
    return gulp.src(__dirname + '/tools/**/*')
               .pipe(gulp.dest(global.BUILD_PATH + '/sdk/tools'));
});

gulp.task('sdk/versionsversions', function() {
    var sdkvers = fs.readdirSync('sdk').filter(function(file) {
        return (new RegExp('^v\\d+$')).test(file) && fs.lstatSync('sdk/' + file).isDirectory();
    });

    for (var i in sdkvers) {
        gulp.src(__dirname + '/' + sdkvers[i] + '/**/*')
               .pipe(gulp.dest(global.BUILD_PATH + '/sdk/' + sdkvers[i]));
    }
});

gulp.task('sdk', targets);
