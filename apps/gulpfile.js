var gulp = require('gulp');

var app_targets = [];

for (var i in global.BUILD_SETTINGS.builtin_apps) {
    require(__dirname + '/' + global.BUILD_SETTINGS.builtin_apps[i] + '/gulpfile.js');
    app_targets.push('apps/' + global.BUILD_SETTINGS.builtin_apps[i]);
}

gulp.task('apps', app_targets);
