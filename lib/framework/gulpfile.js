var gulp = require('gulp'),
    fs   = require('fs');

var fws = fs.readdirSync('lib/framework');
var targets = [];

for (var i in fws) {
    if (fs.lstatSync('lib/framework/' + fws[i]).isDirectory()) {
        require('./' + fws[i] + '/gulpfile.js');
        targets.push('lib/framework/' + fws[i]);
    }
}

gulp.task('lib/framework', targets);
