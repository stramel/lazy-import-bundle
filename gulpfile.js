/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

// TODO: add eslint to JS processing

const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const filter = require('gulp-filter');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');

const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const postcss  = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
// const stylelint = require('stylelint');
const cleanCSS = require('postcss-clean');
const posthtml  = require('gulp-posthtml');
const posthtmlPostcss = require('posthtml-postcss');
const htmlmin = require('posthtml-minifier');

const swPrecacheConfig = require('./sw-precache-config.js');
const polymerJson = require('./polymer.json');
const polymerProject = new polymerBuild.PolymerProject(polymerJson);
const buildDirectory = 'build';

const jsMaritzDepsFilter = filter([
  'bower_components/mtz-*/**/*.js',
  'bower_components/hc-*/**/*.js',
  'bower_components/paper-multi-select/**/*.js',
  'bower_components/lazy-imports/*.js'
], {restore: true});

const cssOptions = {};

/**
 * Waits for the given ReadableStream
 */
function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

function build() {
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

    // Lets create some inline code splitters in case you need them later in your build.
    let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
    let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

    // Okay, so first thing we do is clear the build directory
    console.log(`Deleting ${buildDirectory} directory...`);
    del([buildDirectory])
      .then(() => {

        // Let's start by getting your source files. These are all the files
        // in your `src/` directory, or those that match your polymer.json
        // "sources"  property if you provided one.
        let sourcesStream = polymerProject.sources()

          // The `sourcesStreamSplitter` created above can be added here to
          // pull any inline styles and scripts out of their HTML files and
          // into seperate CSS and JS files in the build stream. Just be sure
          // to rejoin those files with the `.rejoin()` method when you're done.
          .pipe(sourcesStreamSplitter.split())

          // Uncomment these lines to add a few more example optimizations to your source files.
          // .pipe(gulpif(/\.js$/, uglify())) // Install gulp-uglify to use
          // .pipe(gulpif(/\.css$/, cssSlam())) // Install css-slam to use
          // .pipe(gulpif(/\.html$/, htmlMinifier())) // Install gulp-html-minify to use

          .pipe(gulpif(/\.js$/, babel({
            presets: ["es2015-script"],
            plugins: ["array-includes"]
          })))
//           .pipe(gulpif(/\.js$/, uglify()))
//           // .pipe(gulpif(/\.css$/, cssSlam()))
//           .pipe(gulpif(/\.css$/, postcss([
//             // stylelint(),
//             autoprefixer(),
//             cleanCSS(cssOptions)
//           ])))
//           // .pipe(gulpif(/\.html$/, htmlMinifier()))
//           .pipe(gulpif(/\.html$/, posthtml([
//             posthtmlPostcss([
//               // stylelint({}),
//               autoprefixer(),
//               cleanCSS(cssOptions)
//             ]),
//             htmlmin({
//               collapseWhitespace: true,
//               removeComments: true
//             })
//           ])))
          // Remember, you need to rejoin any split inline code when you're done.
          .pipe(sourcesStreamSplitter.rejoin());


        // Similarly, you can get your dependencies seperately and perform
        // any dependency-only optimizations here as well.
        let dependenciesStream = polymerProject.dependencies()
          .pipe(dependenciesStreamSplitter.split())
          // Add any dependency optimizations here.
          .pipe(jsMaritzDepsFilter)
          .pipe(babel({
            presets: ['es2015-script'],
            plugins: ['array-includes']
          }))
          .pipe(jsMaritzDepsFilter.restore)
          .pipe(gulpif(/\.js$/, uglify()))
          // .pipe(gulpif(/\.css$/, cssSlam()))
          .pipe(gulpif(/\.css$/, postcss([
            autoprefixer(),
            cleanCSS(cssOptions)
          ])))
          // .pipe(gulpif(/\.html$/, htmlMinifier()))
          .pipe(gulpif(/\.html$/, posthtml([
            posthtmlPostcss([
              autoprefixer(),
              cleanCSS(cssOptions)
            ]),
            htmlmin({
              collapseWhitespace: true,
              removeComments: true
            })
          ])))
          .pipe(dependenciesStreamSplitter.rejoin());

        // Okay, now let's merge your sources & dependencies together into a single build stream.
        let buildStream = mergeStream(sourcesStream, dependenciesStream)
          .once('data', () => {
            console.log('Analyzing build dependencies...');
          });

        // If you want bundling, pass the stream to polymerProject.bundler.
        // This will bundle dependencies into your fragments so you can lazy
        // load them.
        buildStream = buildStream.pipe(polymerProject.bundler());

        // Okay, time to pipe to the build directory
        buildStream = buildStream.pipe(gulp.dest(buildDirectory));

        // waitFor the buildStream to complete
        return waitFor(buildStream);
      })
//       .then(() => {
//         // Okay, now let's generate the Service Worker
//         console.log('Generating the Service Worker...');
//         return polymerBuild.addServiceWorker({
//           project: polymerProject,
//           buildRoot: buildDirectory,
//           bundled: true,
//           swPrecacheConfig: swPrecacheConfig
//         });
//       })
      .then(() => {
        // You did it!
        console.log('Build complete!');
        resolve();
      });
  });
}

gulp.task('build', build);
gulp.task('default', build);
