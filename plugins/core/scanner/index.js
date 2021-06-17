'use strict';

module.exports = lando => {
  // Add the scanner to lando
  // @TODO: eventually this should be in the util component but here for
  // backwards compat for now
  lando.events.on('post-bootstrap-engine', () => {
    lando.scanUrls = require('./lib/scanner')(lando.log, lando.Promise);
  });
};
