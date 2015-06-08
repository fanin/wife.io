var gulp       = require('gulp'),
    minifycss  = require('gulp-minify-css'),
    concat     = require('gulp-concat');

gulp.task('lib/framework/cutie', function() {
    var cutie_css = gulp.src(__dirname + '/**/*.css')
        .pipe(concat('cutie.css'));

    if (!global.DEBUG)
        cutie_css = cutie_css.pipe(minifycss());

    cutie_css = cutie_css.pipe(gulp.dest(global.BUILD_PATH + '/lib/framework/cutie/'));

    return cutie_css;
});
