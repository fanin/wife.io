var gulp   = require('gulp'),
    uglify = require('gulp-uglify');

gulp.task('server', function(cb) {
    var servers = gulp.src([ '!' + __dirname + '/gulpfile.js', __dirname + '/**/*.js']);

    if (!global.DEBUG)
        servers = servers.pipe(uglify());

    servers = servers.pipe(gulp.dest(global.BUILD_PATH + '/server'));
    return servers;
});
