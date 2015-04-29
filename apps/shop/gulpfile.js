var gulp       = require('gulp'),
    fs         = require('fs'),
    path       = require('path'),
    browserify = require('browserify'),
    reactify   = require('reactify'),
    uglify     = require('gulp-uglify'),
    minifycss  = require('gulp-minify-css'),
    concat     = require('gulp-concat'),
    transform  = require('vinyl-transform'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer'),
    del        = require('del'),
    sys        = require('sys'),
    exec       = require('child_process').exec;

var APP_NAME       = path.basename(__dirname),
    APP_TARGET     = 'apps/' + APP_NAME,
    APP_ENTRY      = __dirname + '/js/app.jsx',
    APP_BUILD_PATH = global.BUILD_PATH ? global.BUILD_PATH + '/apps/' : 'build/',
    SDK_PATH       = global.LIB_PATHS || [ '../../lib' ],
    APP_DEBUG      = global.DEBUG;

gulp.task(APP_TARGET, function() {
    var b = browserify({
            entries: [ APP_ENTRY ],
            paths: SDK_PATH,
            debug: APP_DEBUG
        })
        .transform(reactify)
        .bundle()
        .pipe(source('app.js'));

    if (!APP_DEBUG)
        b = b.pipe(buffer()).pipe(uglify());

    b.pipe(gulp.dest(APP_BUILD_PATH + APP_NAME + '/js/'));

    /* Build app css bundle */
    var app_css = gulp.src(__dirname + '/css**/*.css')
        .pipe(concat('app.css'));

    if (!APP_DEBUG)
        app_css = app_css.pipe(minifycss());

    app_css = app_css.pipe(gulp.dest(APP_BUILD_PATH + APP_NAME + '/css'));

    /* Copy rest app resources */
    gulp.src([
        __dirname + '/index.html',
        __dirname + '/manifest.json',
        __dirname + '/img**/*',
        __dirname + '/lib**/**'
    ])
    .pipe(gulp.dest(APP_BUILD_PATH + APP_NAME));
});

gulp.task('archive', function() {
    process.chdir(APP_BUILD_PATH);
    exec('zip -r ' + APP_NAME + '.zip ' + APP_NAME + '/',
        function(error, stdout, stderr) {
            if (error)
                sys.print(stderr);
            else
                sys.print(stdout);
        }
    );
});

gulp.task('clean', function(cb) {
    del(APP_BUILD_PATH, cb);
});

gulp.task('default', [ APP_TARGET ]);
