var gulp = require('gulp'),
    browserify = require('browserify'),
    uglify = require('gulp-uglify'),
    uglifycss = require('gulp-uglifycss'),
    concat = require('gulp-concat'),
    jsonmin = require('gulp-jsonmin'),
    source = require('vinyl-source-stream'),
    del = require('del');

var JQUERY_VERSION = '1.11.1',
    FONTAWESOME_VERSION = '4.2.0';

var OUTPATH = 'build';

gulp.task('server', function() {
    gulp.src(['*.js', '!gulpfile.js'])
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH));
    gulp.src('server/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/server'));
});

gulp.task('lib', function() {
    /* Create foundation framework bundle */
    gulp.src('lib/framework/foundation/**/*.js')
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/foundation/'));

    /* Create UIKit js bundle */
    gulp.src('lib/framework/ui/**/*.js')
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/ui'));

    /* Create UIKit css bundle */
    gulp.src('lib/framework/ui/**/*.css')
        .pipe(concat('bundle.css'))
        .pipe(uglifycss())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/ui'));

    /* Copy UIKit images */
    gulp.src([
        'lib/framework/ui/**/*',
        '!lib/framework/ui/**/js',
        '!lib/framework/ui/**/css',
        '!lib/framework/ui/**/*.js',
        '!lib/framework/ui/**/*.css'
    ])
    .pipe(gulp.dest(OUTPATH + '/lib/framework/ui'));

    /* Copy 3rd party libraries */
    gulp.src('lib/jquery/jquery-' + JQUERY_VERSION + '.min.js')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery'));
    gulp.src('lib/jquery/plugins/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery/plugins'));
    gulp.src('lib/jquery/ui/' + JQUERY_VERSION + '/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery/ui/' + JQUERY_VERSION));
    gulp.src('lib/font-awesome/' + FONTAWESOME_VERSION + '/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/font-awesome/' + FONTAWESOME_VERSION));
});

gulp.task('ui-kits', function() {
    return browserify({
        entries: ['./lib/framework/ui/ui-kits.js'],
        standalone: 'Page',
        debug: true
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(OUTPATH + '/lib/framework/ui/'))
});

gulp.task('app', function() {
    gulp.src('apps/**/*')
        .pipe(gulp.dest(OUTPATH + '/apps'));
});

gulp.task('api', function() {
    gulp.src('api/*.json')
        .pipe(jsonmin())
        .pipe(gulp.dest(OUTPATH + '/api'));
});

gulp.task('resource', function() {
    gulp.src('resources/**/*')
        .pipe(gulp.dest(OUTPATH + '/resources'));
});

gulp.task('config', function() {
    gulp.src(['package.json', 'settings.json'])
        .pipe(gulp.dest(OUTPATH));
});

gulp.task('clean', function(cb) {
    del(OUTPATH, cb);
});

gulp.task('default', [
    'server',
    'lib',
    //'ui-kits',
    'app',
    'api',
    'resource',
    'config'
]);

