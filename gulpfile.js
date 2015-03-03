var gulp       = require('gulp'),
    browserify = require('browserify'),
    reactify   = require('reactify'),
    uglify     = require('gulp-uglify'),
    minifycss  = require('gulp-minify-css'),
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
    DEBUG               = true,
    BUILD_APPS          = [ 'launcher', 'template' ];

var targets = [
    'server',
    'diligent',
    'cutie',
    'lib',
    'app',
    'api',
    'resource',
    'config'
];

gulp.task('server', function() {
    var diligent_server = gulp.src(['*.js', '!gulpfile.js'])
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH));
    var servers = gulp.src('server/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(OUTPATH + '/server'));
    return merge(diligent_server, servers);
});

gulp.task('lib', function() {
    /* Copy 3rd party libraries */
    var jquery = gulp.src('lib/jquery/jquery-' + JQUERY_VERSION + '.min.js')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery'));
    var jquery_plugin = gulp.src([
            'lib/jquery/plugins/**/*.min.*',
            'lib/jquery/plugins/**/*.css',
            'lib/jquery/plugins/**/images/*'
        ])
        .pipe(gulp.dest(OUTPATH + '/lib/jquery/plugins'));
    var jquery_ui = gulp.src('lib/jquery/ui/' + JQUERY_VERSION + '/*.min.*')
        .pipe(gulp.dest(OUTPATH + '/lib/jquery/ui/' + JQUERY_VERSION));
    var semantic = gulp.src('lib/semantic/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/semantic/'));
    var font_awesome = gulp.src('lib/font-awesome/' + FONTAWESOME_VERSION + '/**/*')
        .pipe(gulp.dest(OUTPATH + '/lib/font-awesome/' + FONTAWESOME_VERSION));
    var react = gulp.src('lib/react/react-' + REACT_VERSION + '*.js')
        .pipe(gulp.dest(OUTPATH + '/lib/react'));

    return merge(
        jquery,
        jquery_plugin,
        jquery_ui,
        semantic,
        font_awesome,
        react
    );
});

gulp.task('diligent', function() {
    var clients = browserify({
        entries: ['./lib/framework/diligent/clients/clients.js'],
            debug: DEBUG
        })
        .bundle()
        .pipe(source('clients.min.js'));

    if (!DEBUG)
        clients = clients.pipe(buffer()).pipe(uglify());

    clients.pipe(gulp.dest(OUTPATH + '/lib/framework/diligent/'));

    var agent_js = browserify({
        entries: ['./lib/framework/diligent/app/js/agent.js'],
            debug: DEBUG
        })
        .transform(reactify)
        .bundle()
        .pipe(source('agent.min.js'));

    if (!DEBUG)
        agent_js = agent_js.pipe(buffer()).pipe(uglify());

    agent_js.pipe(gulp.dest(OUTPATH + '/lib/framework/diligent/'));

    var agent_css = gulp.src('lib/framework/diligent/app/css/*.css')
    .pipe(concat('agent.min.css'))
        .pipe(minifycss())
        .pipe(gulp.dest(OUTPATH + '/lib/framework/diligent/'));

    return merge(
        clients,
        agent_js,
        agent_css
    );
});

gulp.task('cutie', function() {
    /* Create Cutie UI js bundle */
    var cutie_js = browserify({
        entries: ['./lib/framework/cutie/cutie.js'],
        debug: DEBUG
    })
    .transform(reactify)
    .bundle()
    .pipe(source('cutie.min.js'));

    if (!DEBUG)
        cutie_js = cutie_js.pipe(buffer()).pipe(uglify());

    cutie_js.pipe(gulp.dest(OUTPATH + '/lib/framework/cutie/'));

    var cutie_css = gulp.src('lib/framework/cutie/notification/**/*.css')
    .pipe(concat('cutie.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest(OUTPATH + '/lib/framework/cutie/'));

    return merge(
        cutie_js,
        cutie_css
    );
});

gulp.task('app', function() {
    for (var a in BUILD_APPS) {
        /* Build app js bundle */
        var b = browserify({
                    entries: ['./apps/' + BUILD_APPS[a] + '/js/app.jsx'],
                    debug: DEBUG
                })
                .transform(reactify)
                .bundle()
                .pipe(source('app.min.js'));

        if (!DEBUG)
            b = b.pipe(buffer()).pipe(uglify());

        b.pipe(gulp.dest(OUTPATH + '/apps/' + BUILD_APPS[a] + '/js/'));

        /* Build app css bundle */
        gulp.src('apps/' + BUILD_APPS[a] + '/css**/*.css')
            .pipe(concat('app.min.css'))
            .pipe(minifycss())
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
