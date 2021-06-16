'use strict';

// Modules
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const warnings = require('./lib/warnings');

// Helper to set the LANDO_LOAD_KEYS var
const getKeys = (keys = true) => {
  if (_.isArray(keys)) return keys.join(' ');
  return keys.toString();
};

module.exports = (app, lando) => {
  // Assess our key situation so we can warn users who may have too many
  app.events.on('post-init', () => {
    // Get keys on host
    const sshDir = path.resolve(lando.config.home, '.ssh');
    const keys = _(fs.readdirSync(sshDir))
      .filter(file => !_.includes(['config', 'known_hosts'], file))
      .filter(file => path.extname(file) !== '.pub')
      .value();

    // Determine the key size
    const keySize = _.size(_.get(app, 'config.keys', keys));
    app.log.verbose('analyzing user ssh keys... using %s of %s', keySize, _.size(keys));
    app.log.debug('key config... ', _.get(app, 'config.keys', 'none'));
    app.log.silly('users keys', keys);
    // Add a warning if we have more keys than the warning level
    if (keySize > lando.config.maxKeyWarning) {
      app.addWarning(warnings.maxKeyWarning());
    }
  });

  // Return defualts
  return {
    env: {
      LANDO_LOAD_KEYS: getKeys(_.get(app, 'config.keys')),
    },
  };
};
