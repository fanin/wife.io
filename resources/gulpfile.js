var gulp = require('gulp');

gulp.task('resources', function() {
    return gulp.src([ __dirname + '/**/*', '!' + __dirname + '/gulpfile.js' ])
        .pipe(gulp.dest(global.BUILD_PATH + '/resources'));
});
