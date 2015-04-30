var gulp       = require('gulp'),
    browserify = require('browserify'),
    reactify   = require('reactify'),
    uglify     = require('gulp-uglify'),
    minifycss  = require('gulp-minify-css'),
    concat     = require('gulp-concat'),
    merge      = require('merge-stream'),
    transform  = require('vinyl-transform'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer');

var JQUERY_VERSION      = '1.11.2',
    JQUERYUI_VERSION    = '1.11.1',
    FONTAWESOME_VERSION = '4.2.0',
    REACT_VERSION       = '0.13.1',
    SEMANTIC_UI_THEME   = 'default';

gulp.task('lib/framework/diligent', function() {
    var agent_js = browserify({
        entries: [__dirname + '/framework/diligent/agents/js/agents.js'],
            paths: global.LIB_PATHS,
            debug: global.DEBUG
        })
        .transform(reactify)
        .bundle()
        .pipe(source('agents.js'));

    if (!global.DEBUG)
        agent_js = agent_js.pipe(buffer()).pipe(uglify());

    agent_js.pipe(gulp.dest(global.BUILD_PATH + '/lib/framework/diligent/'));

    var agent_css = gulp.src(__dirname + '/framework/diligent/agents/css/*.css')
        .pipe(concat('agents.css'));

    if (!global.DEBUG)
        agent_css = agent_css.pipe(minifycss());

    agent_css = agent_css.pipe(gulp.dest(global.BUILD_PATH + '/lib/framework/diligent/'));

    return merge(
        agent_js,
        agent_css
    );
});

gulp.task('lib/framework/cutie', function() {
    var cutie_css = gulp.src(__dirname + '/framework/cutie/**/*.css')
        .pipe(concat('cutie.css'));

    if (!global.DEBUG)
        cutie_css = cutie_css.pipe(minifycss());

    cutie_css = cutie_css.pipe(gulp.dest(global.BUILD_PATH + '/lib/framework/cutie/'));

    return cutie_css;
});

gulp.task('lib/external', function() {
    /* Copy 3rd party libraries */
    var jquery = gulp.src(__dirname + '/jquery/jquery-' + JQUERY_VERSION + '.min.js')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/jquery'));
    var jquery_plugin = gulp.src([
            __dirname + '/jquery/plugins/**/*.min.*',
            __dirname + '/jquery/plugins/**/*.css',
            __dirname + '/jquery/plugins/**/images/*'
        ])
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/jquery/plugins'));
    var jquery_ui = gulp.src(__dirname + '/jquery/ui/' + JQUERYUI_VERSION + '/*.min.*')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/jquery/ui/' + JQUERYUI_VERSION));
    var semantic_ui = gulp.src(__dirname + '/semantic/**/*.min.*')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/semantic/'));
    var semantic_ui_theme = gulp.src(__dirname + '/semantic/themes/' + SEMANTIC_UI_THEME + '/**/*')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/semantic/themes/' + SEMANTIC_UI_THEME));
    var font_awesome = gulp.src(__dirname + '/font-awesome/' + FONTAWESOME_VERSION + '/**/*')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/font-awesome/' + FONTAWESOME_VERSION));
    var react = gulp.src(__dirname + '/react/react*-' + REACT_VERSION + '*.js')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/react'));

    return merge(
        jquery,
        jquery_plugin,
        jquery_ui,
        semantic_ui,
        semantic_ui_theme,
        font_awesome,
        react
    );
});

gulp.task('lib/utils', function() {
    return gulp.src(__dirname + '/utils/*.js')
               .pipe(gulp.dest(global.BUILD_PATH + '/lib/utils'));
});

gulp.task('lib/framework', [ 'lib/framework/diligent', 'lib/framework/cutie' ]);
gulp.task('lib', [ 'lib/framework', 'lib/external', 'lib/utils' ]);
