var gulp = require('gulp');

require('./diligent/gulpfile.js');
require('./cutie/gulpfile.js');

gulp.task('lib/framework', [ 'lib/framework/diligent', 'lib/framework/cutie' ]);
