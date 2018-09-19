const ezGulp = require("./ez-gulp");
const argv = require('yargs').argv;
const PROJECT_NAME = "uc";

const JS_FILES = {
  vendor: [
    "src/vendor/*.js"
  ],
  uc: [
    "src/js/under-construction.js",
    "src/js/uc-test.js",
    "src/js/block.js",
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

ezGulp({
  js: JS_FILES,
  static: [],
  less: { uc: ["less/base.less"] },
  DEST: (argv._[0] == 'deploy')?"/var/www/uc.unrest.io/stable/":".dist/",
})