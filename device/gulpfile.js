var gulp     = require('gulp'),
    jsonmin  = require('gulp-jsonmin'),
    fse      = require('fs-extra'),
    objmerge = require('merge');

require(__dirname + '/' + global.DEVICE + '/gulpfile.js');

gulp.task('device', [ 'device/' + global.DEVICE ], function(cb) {
    try {
        var packageJson = objmerge(
            fse.readJsonSync('package.json'),
            fse.readJsonSync(__dirname + '/' + global.DEVICE + '/scripts.json')
        );
    }
    catch (error) {
        return cb('Failed to merge package.json and scripts.json: ' + error);
    }

    delete packageJson.devDependencies;

    try {
        fse.mkdirpSync(global.BUILD_PATH);
        fse.writeJsonSync(global.BUILD_PATH + '/package.json', packageJson);
    }
    catch (error) {
        return cb('Failed to write system package.json: ' + error);
    }

    if (!global.DEBUG)
        gulp.src(global.BUILD_PATH + '/package.json')
            .pipe(jsonmin())
            .pipe(gulp.dest(global.BUILD_PATH));

    var server_settings = gulp.src(__dirname + '/' + global.DEVICE + '/server-settings.json');

    if (!global.DEBUG)
        server_settings = server_settings.pipe(jsonmin());

    server_settings = server_settings.pipe(gulp.dest(global.BUILD_PATH + '/server'));

    return server_settings;
});
