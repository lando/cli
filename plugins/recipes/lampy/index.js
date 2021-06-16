'use strict';

module.exports = lando => {
  // Merge in utilities
  lando.events.on('post-bootstrap-engine', () => {
    lando.utils.lampy = require('./lib/utils');
  });
};
