var riot = require('gulp-riot');
var gulp = require('gulp');
var concat = require("gulp-concat");
var less = require('gulp-less');
var sourcemaps = require("gulp-sourcemaps");
var through = require('through2');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var babel = require('gulp-babel');

var PROJECT_NAME = "uc";

var JS_FILES = [
  "src/js/under-construction.js",
  "src/js/uc-test.js",
  "src/js/lib/diff.js",
  ".dist/_tags.js",
];

gulp.task('build-js', ['build-tag'], function () {
  return gulp.src(JS_FILES)
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(sourcemaps.init())
    .pipe(concat(PROJECT_NAME + '-built.js'))
    //.pipe(uglify({mangle: false, compress: false}))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(".dist/"));
});

var TAG_FILES = [
  "src/tags/tabs.tag",
  "src/tags/konsole.tag",
]

gulp.task('build-tag', function() {
  return gulp.src(TAG_FILES)
    .pipe(riot())
    .pipe(concat("_tags.js"))
    .pipe(gulp.dest(".dist"));
});

LESS_FILES = ["less/base.less"];

gulp.task('build-css', function () {
  return gulp.src(LESS_FILES)
    .pipe(less({}))
    .pipe(concat(PROJECT_NAME+'-built.css'))
    .pipe(gulp.dest(".dist/"));
});


var build_tasks = ['build-js', 'build-css'];
gulp.task('watch', build_tasks, function () {
  gulp.watch(JS_FILES, ['build-js']);
  gulp.watch(TAG_FILES, ['build-js']);
  gulp.watch("less/**/*.less", ['build-css']); // have to watch directory because of relative imports

});

gulp.task('default', build_tasks);
