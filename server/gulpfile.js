var gulp   = require('gulp'),
    uglify = require('gulp-uglify'),
    yuidoc = require("gulp-yuidoc-restapi");

gulp.task('server/bin', function(cb) {
  var server_js = gulp.src([ '!' + __dirname + '/gulpfile.js', __dirname + '/**/*.js' ]);

  // ES6 not supported
  //if (!global.DEBUG)
  //  server_js = server_js.pipe(uglify());

  server_js = server_js.pipe(gulp.dest(global.BUILD_PATH + '/server'));

  gulp.src(__dirname + '/routes/api/**/*.js')
    .pipe(yuidoc.parser(null, 'api.json'))
    .pipe(gulp.dest(global.BUILD_PATH + '/apps/devdoc/data/'));

  return server_js;
});

gulp.task('server', [ 'server/bin' ]);
