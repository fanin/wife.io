var gulp       = require('gulp'),
    browserify = require('browserify'),
    reactify   = require('reactify'),
    uglify     = require('gulp-uglify'),
    minifycss  = require('gulp-minify-css'),
    concat     = require('gulp-concat'),
    merge      = require('merge-stream'),
    transform  = require('vinyl-transform'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer');

gulp.task('lib/framework/diligent', function() {
    var agent_js = browserify({
        entries: [__dirname + '/agents/js/agents.js'],
            paths: global.LIB_PATHS,
            debug: global.DEBUG
        })
        .transform(reactify)
        .bundle()
        .pipe(source('agents.js'));

    if (!global.DEBUG)
        agent_js = agent_js.pipe(buffer()).pipe(uglify());

    agent_js.pipe(gulp.dest(global.BUILD_PATH + '/lib/framework/diligent/'));

    var agent_css = gulp.src(__dirname + '/agents/css/*.css')
        .pipe(concat('agents.css'));

    if (!global.DEBUG)
        agent_css = agent_css.pipe(minifycss());

    agent_css = agent_css.pipe(gulp.dest(global.BUILD_PATH + '/lib/framework/diligent/'));

    return merge(
        agent_js,
        agent_css
    );
});
