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

var build_tasks = [];
var JS_FILES = {
  vendor: [
    "src/vendor/*.js"
  ],
  uc: [
    "src/js/under-construction.js",
    "src/js/uc-test.js",
    "src/js/mouse.js",
    "src/js/diff.js",
    "src/js/utils.js",
    "src/js/record.js",
    "src/js/prepDetails.js",
    "src/tags/konsole.tag",
    "src/tags/uc-command.tag",
    "src/tags/compare-images.tag",
  ]
};

LESS_FILES = ["less/base.less"];

build_tasks.push("build-css");
gulp.task('build-css', function () {
  return gulp.src(LESS_FILES)
    .pipe(less({}))
    .pipe(concat(PROJECT_NAME+'-built.css'))
    .pipe(gulp.dest(DEST));
});

for (let key in JS_FILES) {
  build_tasks.push("build-"+key);
  gulp.task('build-'+key, function () {
    if (key == "vendor") {
      return gulp.src(JS_FILES[key])
        .pipe(concat(key + '-built.js'))
        .pipe(gulp.dest(".dist/"));
    }
    return gulp.src(JS_FILES[key])
      .pipe(sourcemaps.init())
      .pipe(riot())
      .pipe(babel({ presets: ['es2015'] }))
      .pipe(concat(key + '-built.js'))
    //.pipe(uglify({mangle: false, compress: false}))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(DEST));
  });
}

gulp.task('watch', build_tasks, function () {
  for (let key in JS_FILES) {
    gulp.watch(JS_FILES[key], ['build-'+key]);
  }
  gulp.watch("less/**/*.less", ['build-css']); // have to watch directory because of relative imports
});

gulp.task('deploy', build_tasks);

gulp.task('default', build_tasks);
