/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/* eslint-env node */

module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '/bower_components/babel-polyfill/babel-polyfill.js',
    '/bower_components/SpinKit/css/spinners/7-three-bounce.css',
    '/bower_components/normalize-css/normalize.css',
    'src/**/*.html',
    'images/**/*.{ico|jpeg|jpg|png}',
    'data/**/*.json'
  ],
  navigateFallback: 'index.html',
  runtimeCaching: [{
    urlPattern: /\/api\/rest\//,
    // Effectively "stale while revalidate".
    handler: 'fastest',
    options: {
      cache: {
        name: 'api-cache',
        // Use sw-toolbox's LRU expiration.
        maxEntries: 25
      }
    }
  }, {
    // Use a network first strategy for everything else.
    default: 'networkFirst'
  }],
  verbose: true
};
