var gulp  = require('gulp'),
    merge = require('merge-stream');

require('./cutie/gulpfile');

gulp.task('sdk/lib/utils', function() {
  return gulp.src(__dirname + '/utils/**/*.js')
             .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/utils'));
});

gulp.task('sdk/lib/external', function() {

  var JQUERY_VERSION      = '1.11.2',
      JQUERYUI_VERSION    = '1.11.1',
      FONTAWESOME_VERSION = '4.4.0',
      REACT_VERSION       = '0.13.1',
      SEMANTIC_UI_THEME   = 'default';

  /* Copy 3rd party libraries */
  var jquery = gulp.src(__dirname + '/jquery/jquery-' + JQUERY_VERSION + '.min.js')
                   .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/jquery'));
  var jquery_plugin = gulp.src([
        __dirname + '/jquery/plugins/**/*.min.*',
        __dirname + '/jquery/plugins/**/*.css',
        __dirname + '/jquery/plugins/**/images/*',
        __dirname + '/jquery/plugins/*.js'
      ])
      .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/jquery/plugins'));
  var jquery_ui = gulp.src(__dirname + '/jquery/ui/' + JQUERYUI_VERSION + '/*.min.*')
      .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/jquery/ui/' + JQUERYUI_VERSION));
  var semantic_ui = gulp.src(__dirname + '/semantic/**/*.min.*')
      .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/semantic/'));
  var semantic_ui_theme = gulp.src(__dirname + '/semantic/themes/' + SEMANTIC_UI_THEME + '/**/*')
      .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/semantic/themes/' + SEMANTIC_UI_THEME));
  var font_awesome = gulp.src(__dirname + '/font-awesome/' + FONTAWESOME_VERSION + '/**/*')
      .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/font-awesome/'));
  var react = gulp.src(__dirname + '/react/react*-' + REACT_VERSION + '*.js')
      .pipe(gulp.dest(global.BUILD_PATH + '/sdk/lib/react'));

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

gulp.task('sdk/lib', [ 'sdk/lib/cutie', 'sdk/lib/utils', 'sdk/lib/external' ]);
