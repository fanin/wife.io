var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    uglifycss = require('gulp-uglifycss'),
    concat = require('gulp-concat'),
    jsonmin = require('gulp-jsonmin'),
    del = require('del');

var JQUERY_VERSION = '1.11.1',
    FONTAWESOME_VERSION = '4.2.0';

gulp.task('server', function() {
    gulp.src(['*.js', '!gulpfile.js'])
        .pipe(uglify())
        .pipe(gulp.dest('build'));
    gulp.src('server/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('build/server'));
});

gulp.task('lib', function() {
    gulp.src('lib/framework/foundation/**/*.js')
        .pipe(concat('foundation-bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('build/lib/framework/foundation/'));
    gulp.src([
            'lib/framework/ui/**/*',
            '!lib/framework/ui/**/*.js',
            '!lib/framework/ui/**/*.css'
        ])
        .pipe(gulp.dest('build/lib/framework/ui'));
    gulp.src('lib/framework/ui/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('build/lib/framework/ui'));
    gulp.src('lib/framework/ui/**/*.css')
        .pipe(uglifycss())
        .pipe(gulp.dest('build/lib/framework/ui'));
    gulp.src('lib/jquery/jquery-' + JQUERY_VERSION + '.min.js')
        .pipe(gulp.dest('build/lib/jquery'));
    gulp.src('lib/jquery/plugins/**/*')
        .pipe(gulp.dest('build/lib/jquery/plugins'));
    gulp.src('lib/jquery/ui/' + JQUERY_VERSION + '/**/*')
        .pipe(gulp.dest('build/lib/jquery/ui/' + JQUERY_VERSION));
    gulp.src('lib/font-awesome/' + FONTAWESOME_VERSION + '/**/*')
        .pipe(gulp.dest('build/lib/font-awesome/' + FONTAWESOME_VERSION));
});

gulp.task('app', function() {
    gulp.src('apps/**/*')
        .pipe(gulp.dest('build/apps'));
});

gulp.task('api', function() {
    gulp.src('api/*.json')
        .pipe(jsonmin())
        .pipe(gulp.dest('build/api'));
});

gulp.task('resource', function() {
    gulp.src('resources/**/*')
        .pipe(gulp.dest('build/resources'));
});

gulp.task('config', function() {
    gulp.src(['package.json', 'settings.json'])
        .pipe(gulp.dest('build'));
});

gulp.task('clean', function(cb) {
    del('build', cb);
});

gulp.task('default', [
    'server',
    'lib',
    'app',
    'api',
    'resource',
    'config'
]);

