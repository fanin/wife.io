var gulp    = require('gulp'),
    jsonmin = require('gulp-jsonmin'),
    path    = require('path'),
    fs      = require('fs'),
    fse     = require('fs-extra');

gulp.task('api', function() {
    var specFiles = fs.readdirSync(__dirname + '/');

    for (var f in specFiles) {
        if (path.extname(specFiles[f]) === '.json') {
            var spec = fse.readJsonSync(__dirname + '/' + specFiles[f]);

            (function traverse(o) {
                for (var i in o) {
                    if (o[i] !== null && typeof(o[i]) == 'object') {
                        if (o[i].DESC)
                            delete o[i].DESC;
                        else
                            traverse(o[i]);
                    }
                }
            })(spec);

            fse.mkdirpSync(global.BUILD_PATH + '/api/');
            fse.writeJsonSync(global.BUILD_PATH + '/api/' + specFiles[f], spec);

            if (!global.DEBUG) {
                gulp.src(global.BUILD_PATH + '/api/' + specFiles[f])
                    .pipe(jsonmin())
                    .pipe(gulp.dest(global.BUILD_PATH + '/api'));
            }
        }
    }
});
