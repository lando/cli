'use strict';

module.exports = lando => {
  // Merge in utilities
  lando.events.on('post-bootstrap-engine', () => {
    lando.utils.recipes = require('./lib/utils');
  });
};
