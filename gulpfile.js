var gulp       = require('gulp'),
    browserify = require('browserify'),
    reactify   = require('reactify'),
    uglify     = require('gulp-uglify'),
    uglifycss  = require('gulp-uglifycss'),
    concat     = require('gulp-concat'),
    streamify  = require('gulp-streamify'),
    merge      = require('merge-stream'),
    jsonmin    = require('gulp-jsonmin'),
    transform  = require('vinyl-transform'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer'),
    del        = require('del');

var JQUERY_VERSION      = '1.11.1',
    FONTAWESOME_VERSION = '4.2.0',
    REACT_VERSION       = '0.12.2',
    OUTPATH             = 'mywife',
    BUILD_APPS          = [ 'template' ];

var targets = [
    'server',
    'base',
    'ui',
    'lib',
    'app',
    'api',
    'resource',
    'config'
];

gulp.task('server', function() {
    var base = gulp.src(['*.js', '!gulpfile.js'])
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH));
    var servers = gulp.src('server/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/server'));
    return merge(base, servers);
});

gulp.task('lib', function() {
    /* Copy 3rd party libraries */
    var jquery = gulp.src('lib/jquery/jquery-' + JQUERY_VERSION + '.min.js')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery'));
    var jquery_plugin = gulp.src('lib/jquery/plugins/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery/plugins'));
    var jquery_ui = gulp.src('lib/jquery/ui/' + JQUERY_VERSION + '/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery/ui/' + JQUERY_VERSION));
    var font_awesome = gulp.src('lib/font-awesome/' + FONTAWESOME_VERSION + '/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/font-awesome/' + FONTAWESOME_VERSION));
    var react = gulp.src('lib/react/react-' + REACT_VERSION + '.min.js')
        .pipe(gulp.dest(OUTPATH + '/lib/react'));

    return merge(
        jquery,
        jquery_plugin,
        jquery_ui,
        font_awesome,
        react
    );
});

gulp.task('base', function() {
    var base_clients = browserify({
            entries: ['./lib/framework/base/clients/clients.js'],
            debug: false
        })
        .bundle()
        .pipe(source('clients.min.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/base/'));

    var base_diligent_js = browserify({
            entries: ['./lib/framework/base/app/js/agent.js'],
            debug: false
        })
        .transform(reactify)
        .bundle()
        .pipe(source('diligent.min.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/base/'));

    var base_diligent_css = gulp.src('lib/framework/base/app/css/*.css')
        .pipe(concat('diligent.min.css'))
        .pipe(uglifycss())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/base/'));

    return merge(
        base_clients,
        base_diligent_js,
        base_diligent_css
    );
});

gulp.task('ui', function() {
    /* Copy Semantic UI framework */
    return gulp.src('lib/framework/ui-kits/semantic/**/*')
               .pipe(gulp.dest(OUTPATH + '/lib/framework/ui-kits/semantic/'));
});

gulp.task('ui-kits', function() {
    /* Create UIKit js bundle */
    var uikits_js = gulp.src('lib/framework/ui/**/*.js')
        .pipe(concat('uikit-bundle.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/ui'));

    /* Create UIKit css bundle */
    var uikits_css = gulp.src('lib/framework/ui/**/*.css')
        .pipe(concat('uikit-bundle.min.css'))
        .pipe(uglifycss())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/ui'));

    /* Copy UIKit images */
    var uikits_res = gulp.src([
        'lib/framework/ui/**/*',
        '!lib/framework/ui/**/js',
        '!lib/framework/ui/**/css',
        '!lib/framework/ui/**/*.js',
        '!lib/framework/ui/**/*.css'
    ])
    .pipe(gulp.dest(OUTPATH + '/lib/framework/ui'));

    return browserify({
        entries: ['./lib/framework/ui/ui-kits.js'],
        debug: false
    })
    .bundle()
    .pipe(source('ui-kits.js'))
    .pipe(gulp.dest(OUTPATH + '/lib/framework/ui/'))
});

gulp.task('app', function() {
    for (var a in BUILD_APPS) {
        /* Build app js bundle */
        browserify({
            entries: ['./apps/' + BUILD_APPS[a] + '/js/app.jsx'],
            debug: false
        })
        .transform(reactify)
        .bundle()
        .pipe(source('app.min.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/apps/' + BUILD_APPS[a] + '/js/'));

        /* Build app css bundle */
        gulp.src('apps/' + BUILD_APPS[a] + '/css**/*.css')
            .pipe(concat('app.min.css'))
            .pipe(uglifycss())
            .pipe(gulp.dest(OUTPATH + '/apps/' + BUILD_APPS[a] + '/css'));

        /* Copy rest app resources */
        gulp.src([
            'apps/' + BUILD_APPS[a] + '/index.html',
            'apps/' + BUILD_APPS[a] + '/manifest.json',
            'apps/' + BUILD_APPS[a] + '/img**/*',
        ])
        .pipe(gulp.dest(OUTPATH + '/apps/' + BUILD_APPS[a]));
    }
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

gulp.task('default', targets);
gulp.task('brackets-default', targets);
