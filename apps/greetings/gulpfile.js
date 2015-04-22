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

var LIB_PATH   = '../../lib',
    APP_NAME   = path.basename(__dirname),
    APP_ENTRY  = './js/app.jsx',
    OUTPATH    = 'build/',
    DEBUG      = false;

gulp.task('default', function() {
    var b = browserify({
            entries: [ APP_ENTRY ],
            paths: [ LIB_PATH ],
            debug: DEBUG
        })
        .transform(reactify)
        .bundle()
        .pipe(source('app.min.js'));

    if (!DEBUG)
        b = b.pipe(buffer()).pipe(uglify());

    b.pipe(gulp.dest(OUTPATH + APP_NAME + '/js/'));

    /* Build app css bundle */
    gulp.src('css**/*.css')
        .pipe(concat('app.min.css'))
        .pipe(minifycss())
        .pipe(gulp.dest(OUTPATH + APP_NAME + '/css'));

    /* Copy rest app resources */
    gulp.src([
        'index.html',
        'manifest.json',
        'img**/*',
    ])
    .pipe(gulp.dest(OUTPATH + APP_NAME));
});

gulp.task('archive', function() {
    process.chdir(OUTPATH);
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
    del(OUTPATH, cb);
});
