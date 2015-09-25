var gulp       = require('gulp'),
    fs         = require('fs-extra'),
    path       = require('path'),
    browserify = require('browserify'),
    babelify   = require('babelify'),
    uglify     = require('gulp-uglify'),
    minifycss  = require('gulp-minify-css'),
    gutil      = require('gulp-util'),
    cssjoin    = require('gulp-cssjoin'),
    concat     = require('gulp-concat'),
    transform  = require('vinyl-transform'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer'),
    util       = require('util'),
    exec       = require('child_process').exec;

var APP_NAME       = path.basename(__dirname),
    APP_TARGET     = 'apps/' + APP_NAME,
    APP_ENTRY      = __dirname + '/js/app.js',
    APP_BUILD_PATH = global.BUILD_PATH ? global.BUILD_PATH + '/apps/' : 'build/',
    SDK_PATH       = global.SDK_PATH || '/sdk',
    API_PATH       = path.join(SDK_PATH, 'v1'),
    APP_DEBUG      = global.DEBUG;

gulp.task(APP_TARGET, function() {
  var b = browserify({
      entries: [ APP_ENTRY ],
      paths: [ SDK_PATH, API_PATH ],
      debug: APP_DEBUG
    })
    .transform(babelify.configure({
      optional: ["es7.classProperties"]
    }))
    .bundle()
    .pipe(source('app.js'));

  if (!APP_DEBUG)
    b = b.pipe(buffer())
         .pipe(babel({ compact: false }))
         .pipe(uglify())
         .on('error', gutil.log);

  b.pipe(gulp.dest(APP_BUILD_PATH + APP_NAME + '/js/'));

  /* Build app css bundle */
  var app_css = gulp.src(__dirname + '/css**/*.css');

  if (APP_DEBUG)
    app_css = app_css.pipe(cssjoin())
                     .pipe(concat('app.css'));
  else
    app_css = app_css.pipe(concat('app.css'))
                     .pipe(minifycss());

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
        util.print(stderr);
      else
        util.print(stdout);
    }
  );
});

gulp.task('clean', function(cb) {
  fs.remove(APP_BUILD_PATH, cb);
});

gulp.task('distclean', function(cb) {
  fs.remove([ APP_BUILD_PATH, __dirname + '/node_modules' ], cb);
});

gulp.task('default', [ APP_TARGET ]);
