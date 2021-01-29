const gulp = require('gulp');
const pkg = require('./package.json');
const fs = require('fs');
const path = require('path');
const merge = require('merge-stream');
const filesize = require('gulp-size');
const inject = require('gulp-inject');
const concat = require('gulp-concat');
const spritesmith = require('gulp.spritesmith');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const wait = require('gulp-wait');
const replace = require('gulp-replace');
const argv = require('yargs').argv;
const del = require('del');
const buffer = require('vinyl-buffer');
const chalk = require('chalk');

// Console Colors
const cErr = chalk.red;
const cInfo = chalk.dim.gray;
const cTask = chalk.bold.green;

const browsersync = require('browser-sync').create();

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: './dev/',
    },
    port: 3000,
    directory: true,
  });
  done();
}
// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Watch Files for BrowserSync
// Does not pickup changes to sprite folders these must be updated manually to create new sprites
function watchFiles() {
  // DEPRECATED UNTIL A MORE ELEGANT SOLUTION. THIS TRIGGERS MULTIPLE BUILD AND RELOADS
  // // If sprites are updated, remake them and reload the page
  // gulp.watch(
  //   ['src/variants/**/sprites/*.png',
  //   'src/variants/**/sprites/*.jpg',
  //   'src/variants/**/sprites/*.gif'],
  //   gulp.series('makesprites')
  // ); // TODO: This is brute force. Should target only changed directories.

  // If changes are made to global or variant html, js or css, or background
  // images which don't require re-making sprites, rebuild everything and reload
  // the browser
  gulp.watch(
    [
      'src/global/styles/*.css',
      'src/global/scripts/**/*.js',
      'src/variants/*.js',
      'src/variants/*.css',
      'src/variants/**/*.html',
      'src/variants/**/*.js',
      'src/variants/**/*.css',
      'src/variants/**/assets/*.jpg',
      'src/variants/**/assets/*.png',
      'src/variants/**/assets/*.gif',
    ],
    gulp.series('build', browserSyncReload),
  );
}

// gets a folder in the specified path
function getFolders(dir) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

// makes a sprite sheet for a banner with optional variatn, size, and retina parameters
function makesprite(variant, size, retina) {
  var folder = variant + '/' + size + '/';
  var origin = 'src/variants/' + folder;
  var dest = origin;
  var spriteData;

  if (!retina) {
    spriteData = gulp
      .src(origin + 'assets/sprites/*.*') // source path of the sprite images
      .pipe(
        spritesmith({
          imgName: 'txtsprite.png',
          imgPath: 'assets/txtsprite.png',
          cssName: 'txtsprite.css',
          padding: 1,
        }),
      )
      .on('error', function (error) {
        console.log(cErr(error));
      });
  } else {
    spriteData = gulp
      .src(origin + 'assets/sprites/*.*') // source path of the sprite images
      .pipe(
        spritesmith({
          retinaSrcFilter: [origin + 'assets/sprites/*@2x.*'],
          imgName: 'txtsprite.png',
          retinaImgName: 'txtsprite2x.png',
          imgPath: 'assets/txtsprite.png',
          retinaImgPath: 'assets/txtsprite2x.png',
          cssName: 'txtsprite.css',
          padding: 1,
        }),
      )
      .on('error', function (error) {
        console.log(cErr(error));
      });
  }

  spriteData.css.pipe(gulp.dest(dest)); // output path for the CSS

  spriteData.img
    .pipe(buffer())
    .pipe(
      imagemin([pngquant({ quality: [0.1, 0.3], speed: 4 })], {
        verbose: true,
      }),
    )
    .pipe(gulp.dest(dest + 'assets/')); // output path for the sprite
}

// just consoles out the pkg.version
gulp.task('default', function () {
  // place code for your default task here
  console.info(cInfo('version: '), pkg.version);
});

// Cleans the dist and dev folders
gulp.task('clean', function () {
  // eslint-disable-next-line
  return del(['dist/**/*', 'dev/**/*']).then(function (paths) {
    // console.log(cTask('Cleaning...\n'), cInfo(paths.join('\n ')));
    console.log(cTask('Cleaning...\n'));
  });
});

/** take the src folder, iterate over the structure to two depths assuming: first level = variants, second level = sizes.
  you can pass arguments on the command line -v to specify a single variant and -s to specify a single size. These
  arguments can be used together or seperately
  @param --variant [variant folder name] (optional)
  @param --s [size folder name] (optional)
  @param --r [retina images] (optional, default true) requires retina images exist for all images in the spritesheet `[file]@2x.[ext]`
  @usage gulp makesprites --variant myvariant --s mysize --r true
**/
gulp.task('makesprites', async function () {
  console.log(cTask('Making sprite sheets...'));
  console.log(cInfo('variant'), argv.variant, cInfo(', size'), argv.s);
  var retina = argv.r === undefined ? false : argv.r === 'false' ? false : true;
  var variants =
    argv.variant === undefined ? getFolders('src/variants/') : [argv.variant];

  for (var i = 0, vl = variants.length; i < vl; i++) {
    var variant = variants[i];
    var sizes =
      argv.s === undefined ? getFolders('src/variants/' + variant) : [argv.s];

    for (var j = 0, sl = sizes.length; j < sl; j++) {
      var size = sizes[j];
      await makesprite(variant, size, retina);
    }
  }

  return Promise.resolve('All sprites built');
});

// take the src folder, iterate over the structure to two depths assuming: first level = variants, second level = sizes.
// builds the src files into the dev folder. Concats JS and css
gulp.task(
  'build',
  gulp.series('clean', function () {
    console.log(cTask('Building Banners...'));

    var variants = getFolders('src/variants/');
    var fullmerge = merge();

    for (var i = 0, vl = variants.length; i < vl; i++) {
      var variant = variants[i];
      var sizes = getFolders('src/variants/' + variant);

      for (var j = 0, sl = sizes.length; j < sl; j++) {
        var size = sizes[j];
        var variantFolder = 'src/variants/' + variant + '/';
        var sizeFolder = variantFolder + size + '/';
        var dest = 'dev/' + variant + '/' + size + '/';
        var merged = merge();

        // move images
        gulp
          .src([
            'src/global/assets/**',
            sizeFolder + 'assets/**',
            '!' + sizeFolder + 'assets/sprites/',
            '!' + sizeFolder + 'assets/sprites/**',
          ])
          .pipe(gulp.dest(dest + 'assets/'));

        // move over any manifest.js files for FlashTalking ads to the root of each banner next to index.html
        gulp
          .src([sizeFolder + 'manifest.js'], { allowEmpty: true })
          .pipe(gulp.dest(dest));

        // concat the styles
        var styleStream = gulp
          .src([
            'src/global/styles/*.css',
            variantFolder + '*.css',
            sizeFolder + '*.css',
          ])
          .pipe(concat('screen.css'))
          .pipe(gulp.dest(dest));
        merged.add(styleStream);

        // concat the javascript
        var scriptStream = gulp
          .src([
            'src/global/scripts/**/*.js',
            variantFolder + '*.js',
            sizeFolder + '*.js',
            '!' + sizeFolder + 'manifest.js',
          ])
          .pipe(concat('scripts.min.js'))
          .pipe(gulp.dest(dest));
        merged.add(scriptStream);

        // inject the style and JS as well as meta info
        var injectStream = gulp
          .src(sizeFolder + '*.html')
          .pipe(inject(merged, { ignorePath: dest, addRootSlash: false }))
          .pipe(replace('{{author}}', pkg.author))
          .pipe(replace('{{description}}', pkg.description))
          .pipe(replace('{{version}}', pkg.version))
          .pipe(
            replace(
              '{{title}}',
              pkg.meta.client +
                ' ' +
                pkg.meta.campaign +
                ' | ' +
                variant +
                ' | ' +
                size +
                ' | ' +
                pkg.version,
            ),
          )
          .pipe(replace('{{width}}', size.substring(0, size.indexOf('x'))))
          .pipe(
            replace(
              '{{height}}',
              size.substring(size.indexOf('x') + 1, size.length),
            ),
          )
          .pipe(gulp.dest(dest))
          .pipe(wait(100)); // insert a slight pause so the file system can write successfully before we zip if this task is part of the zip chain

        fullmerge.add(injectStream);
      }
    }

    return fullmerge;
  }),
);

// take the src folder, iterate over the structure to two depths assuming: first level = variants, second level = sizes.
// create zips per size for each variant and place in the dist folder
function archive(done) {
  console.log(cTask('Zipping Banners'));
  const gulpZip = require('gulp-zip'); // zip files
  // var date = new Date().toISOString().replace(/[^0-9]/g, '');
  const variants = getFolders('dev/');
  const zipArray = [];

  for (var i = 0, vl = variants.length; i < vl; i++) {
    const variant = variants[i];
    const sizes = getFolders('dev/' + variant);

    for (var j = 0, sl = sizes.length; j < sl; j++) {
      const size = sizes[j];
      const folder = 'dev/' + variant + '/' + size + '/';
      const filename =
        pkg.meta.client +
        '-' +
        pkg.meta.campaign +
        '-' +
        variant +
        '-' +
        size +
        '-v' +
        pkg.version +
        '.zip';

      //console.info(filename);

      // add the directory to the zip array.
      const singleZip = function () {
        return gulp
          .src(folder + '**/*')
          .pipe(gulpZip(filename))
          .pipe(filesize({ title: '...compressed size' }))
          .pipe(gulp.dest('dist'));
      };

      // Use function.displayName to customize the task name
      singleZip.displayName = `${variant}-${size}`;

      zipArray.push(singleZip);
    }
  }

  return gulp.series(...zipArray, (seriesDone) => {
    seriesDone();
    done();
  })();
}

/** Development-optimized workflow with browsersync
  Clean/build first, then serve and watch
  @usage gulp serve
**/
gulp.task(
  'serve',
  gulp.series('build', gulp.parallel(watchFiles, browserSync)),
  console.log(cTask('BrowserSync Watch DEV MODE')),
);
gulp.task('zip', gulp.series('build', archive));
