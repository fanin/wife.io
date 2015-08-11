var gulp  = require('gulp'),
    merge = require('merge-stream');

var JQUERY_VERSION      = '1.11.2',
    JQUERYUI_VERSION    = '1.11.1',
    FONTAWESOME_VERSION = '4.2.0',
    REACT_VERSION       = '0.13.1',
    SEMANTIC_UI_THEME   = 'default';

require('./framework/gulpfile');

gulp.task('lib/external', function() {
    /* Copy 3rd party libraries */
    var jquery = gulp.src(__dirname + '/jquery/jquery-' + JQUERY_VERSION + '.min.js')
        .pipe(gulp.dest(global.BUILD_PATH + '/lib/jquery'));
    var jquery_plugin = gulp.src([
            __dirname + '/jquery/plugins/**/*.min.*',
            __dirname + '/jquery/plugins/**/*.css',
            __dirname + '/jquery/plugins/**/images/*',
            __dirname + '/jquery/plugins/*.js'
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
    return gulp.src(__dirname + '/utils/**/*.js')
               .pipe(gulp.dest(global.BUILD_PATH + '/lib/utils'));
});

gulp.task('lib', [ 'lib/framework', 'lib/external', 'lib/utils' ]);
