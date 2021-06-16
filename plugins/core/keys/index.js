'use strict';

// Modules
const mkdirp = require('mkdirp');

module.exports = lando => {
  // Ensure some dirs exist before we start
  mkdirp.sync(path.join(lando.config.home, '.ssh'));
  // Return some default things
  return {config: {maxKeyWarning: 10}};
};
