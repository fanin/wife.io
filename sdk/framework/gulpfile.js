var gulp = require('gulp'),
    fs   = require('fs');

var fws = fs.readdirSync('sdk/framework');
var targets = [];

for (var i in fws) {
    if (fs.lstatSync('sdk/framework/' + fws[i]).isDirectory()) {
        require('./' + fws[i] + '/gulpfile.js');
        targets.push('sdk/framework/' + fws[i]);
    }
}

gulp.task('sdk/framework', targets);
