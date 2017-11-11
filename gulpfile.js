var riot = require('gulp-riot');
var gulp = require('gulp');
var concat = require("gulp-concat");
var less = require('gulp-less');
var sourcemaps = require("gulp-sourcemaps");
var through = require('through2');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var babel = require('gulp-babel');
var argv = require('yargs').argv;

var PROJECT_NAME = "uc";
var DEST = (argv._[0] == 'deploy')?"/var/www/uc.unrest.io/stable/":".dist/";

var JS_FILES = [
  "lib/diff.js",
  "lib/pixelmatch.js",
  "src/js/under-construction.js",
  "src/js/uc-test.js",
  "src/js/mouse.js",
  "src/js/diff.js",
  "src/js/utils.js",
  "src/js/record.js",
  "src/tags/konsole.tag",
];

gulp.task('build-js', function () {
  return gulp.src(JS_FILES)
    .pipe(riot())
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(sourcemaps.init())
    .pipe(concat(PROJECT_NAME + '-built.js'))
    //.pipe(uglify({mangle: false, compress: false}))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(DEST));
});

LESS_FILES = ["less/base.less"];

gulp.task('build-css', function () {
  return gulp.src(LESS_FILES)
    .pipe(less({}))
    .pipe(concat(PROJECT_NAME+'-built.css'))
    .pipe(gulp.dest(DEST));
});


var build_tasks = ['build-js', 'build-css'];
gulp.task('watch', build_tasks, function () {
  gulp.watch(JS_FILES, ['build-js']);
  gulp.watch("less/**/*.less", ['build-css']); // have to watch directory because of relative imports
});

gulp.task('deploy', build_tasks);

gulp.task('default', build_tasks);
