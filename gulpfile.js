var gulp = require('gulp');
var pkg = require('./package.json');
var fs = require('fs');
var path = require('path');
var merge = require('merge-stream');
var filesize = require('gulp-size');
var inject = require('gulp-inject');
var concat = require('gulp-concat');
var spritesmith = require('gulp.spritesmith');
var imagemin = require('gulp-imagemin');
var wait = require('gulp-wait');
var replace = require('gulp-replace');
var argv = require('yargs').argv;
var eslint = require('gulp-eslint');
var del = require('del');
var buffer = require('vinyl-buffer');
var chalk = require('chalk');

// Console Colors
// var cErr = chalk.bold.red;
var cInfo = chalk.dim.gray;
var cTask = chalk.bold.green;

var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

function makesprite(variant, size) {
  var folder = variant + '/' + size + '/';
  var origin = 'src/variants/' + folder;
  var dest = origin;

  var spriteData = gulp.src(origin + 'assets/sprites/*.*') // source path of the sprite images
  .pipe(spritesmith({
    imgName: 'txtsprite.png',
    imgPath: 'assets/txtsprite.png',
    cssName: 'txtsprite.css',
    padding: 1
  }));

  spriteData.css.pipe(gulp.dest(dest)); // output path for the CSS

  spriteData.img
    .pipe(buffer())
    .pipe(imagemin()) // compress PNG
    .pipe(gulp.dest(dest + 'assets/')); // output path for the sprite
}

gulp.task('default', function() {
  // place code for your default task here
  console.info(cInfo('version: '), pkg.version);
});

// Cleans the dist and dev folders
gulp.task('clean', function () {
  return del(['dist/**/*', 'dev/**/*'])
    .then(function(paths) {
      console.log(cTask('Cleaning...\n'), cInfo(paths.join('\n ')));
    });
});

// lints the js files for errors
gulp.task('lint', function () {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp.src(['src/**/*.js'])
      // eslint() attaches the lint output to the "eslint" property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError());
});

/** take the src folder, iterate over the structure to two depths assuming: first level = variants, second level = sizes.
  you can pass arguments on the command line -v to specify a single variant and -s to specify a single size. These
  arguments can be used together or seperately
  @param -v [variant folder name] (optional)
	@param -s [size folder name] (optional)
	@usage gulp makesprites -v myvariant -s mysize
**/
gulp.task('makesprites', function() {
  var variants = (argv.v === undefined) ? getFolders('src/variants/') : [argv.v];

  for (var i=0, vl=variants.length; i < vl; i++) {
    var variant = variants[i];
    var sizes = (argv.s === undefined) ? getFolders('src/variants/' + variant): [argv.s];

    for (var j=0, sl=sizes.length; j < sl; j++) {
      var size = sizes[j];
      if (size != 'tablet') {
        makesprite(variant, size);
      }
    }
  }
});

// take the src folder, iterate over the structure to two depths assuming: first level = variants, second level = sizes.
// builds the src files into the dev folder. Concats JS and css
gulp.task('build', ['clean','lint'], function () {
  var variants = getFolders('src/variants/');
  var fullmerge = merge();

  for (var i=0, vl=variants.length; i < vl; i++) {
    var variant = variants[i];
    var sizes = getFolders('src/variants/' + variant);

    for (var j=0, sl=sizes.length; j < sl; j++) {
      var size = sizes[j];
      var folder = variant + '/' + size + '/';
      var origin = 'src/variants/' + folder;
      var dest = 'dev/' + folder;
      var merged = merge();

      // move images
      gulp.src(['src/global/assets/**', origin + 'assets/**', '!' + origin + 'assets/sprites/', '!' + origin + 'assets/sprites/**'])
        .pipe(gulp.dest(dest + 'assets/'));

      // concat the styles
      var styleStream = gulp.src(['src/global/styles/*.css', origin + '*.css'])
        .pipe(concat('screen.css'))
        .pipe(gulp.dest(dest));
      merged.add(styleStream);

      // concat the javascript
      var scriptStream = gulp.src(['src/global/scripts/**/*.js', origin + '*.js'])
        .pipe(concat('scripts.min.js'))
        .pipe(gulp.dest(dest));
      merged.add(scriptStream);

      // inject the style and JS as well as meta info
      var injectStream = gulp.src(origin + '*.html')
      .pipe ( inject(merged, {ignorePath: dest, addRootSlash: false}))
      .pipe ( replace('{{author}}', pkg.author))
      .pipe ( replace('{{description}}', pkg.description))
      .pipe ( replace('{{version}}', pkg.version))
      .pipe ( replace('{{title}}', pkg.meta.client + ' ' + pkg.meta.campaign + ' | ' + variant + ' | ' + size + ' | ' + pkg.version))
      .pipe ( replace('{{width}}', size.substring(0,size.indexOf('x'))))
      .pipe ( replace('{{height}}', size.substring(size.indexOf('x')+1, size.length)))
      .pipe ( gulp.dest(dest))
      .pipe(wait(100)); // insert a slight pause so the file system can write successfully before we zip if this task is part of the zip chain

      fullmerge.add(injectStream);
    }
  }

  return fullmerge;
});



// take the src folder, iterate over the structure to two depths assuming: first level = variants, second level = sizes.
// create zips per size for each variant and place in the dist folder
gulp.task('zip', ['build'], function () {
  var zip = require('gulp-zip'); // zip files
  // var date = new Date().toISOString().replace(/[^0-9]/g, '');
  var merged = merge();
  var variants = getFolders('dev/');

  for (var i=0, vl=variants.length; i < vl; i++) {
    var variant = variants[i];
    var sizes = getFolders('dev/' + variant);

    for (var j=0, sl=sizes.length; j < sl; j++) {
      var size = sizes[j];
      var folder = 'dev/' + variant + '/' + size + '/';
      var filename = pkg.meta.client + ' ' + pkg.meta.campaign + ' ' + variant + ' ' + size + ' v' + pkg.version + '.zip';

      //console.info(filename);

      // keep directory structure
      var zipStream = gulp.src(folder + '**/*')
      .pipe ( zip(filename))
      .pipe ( filesize({title:filename, showFiles:true}))
      .pipe ( gulp.dest('dist'));

      merged.add(zipStream);
    }
  }

  return merged;
});

// Development-optimized workflow with browsersync
// Clean/build first, then serve and watch
gulp.task('serve', ['build'], function () {
  browserSync.init({
    server: './dev',
    directory: true
  });

  // If changes are made to global or variant html, js or css, or background
  // images which don't require re-making sprites, rebuild everything and reload
  // the browser
  gulp.watch(
    ['src/global/styles/*.css',
    'src/global/scripts/vendors/**/*.js',
    'src/variants/**/*.html',
    'src/variants/**/*.js',
    'src/variants/**/*.css',
    'src/variants/**/background.jpg'],
        ['build', reload]);

  // If sprites are updated, remake them and reload the page
  gulp.watch(
    ['src/variants/**/sprites/*.png',
    'src/variants/**/sprites/*.jpg',
    'src/variants/**/sprites/*.gif'],
        ['makesprites', reload]); // TODO: This is brute force. Should target only changed directories.
});
