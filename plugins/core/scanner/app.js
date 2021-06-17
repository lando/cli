'use strict';

// Modules
const _ = require('lodash');

// Helper to get scannable or not scannable services
const getScannable = (app, scan = true) => _.filter(app.info, service => {
  return _.get(app, `config.services.${service.service}.scanner`, true) === scan;
});

module.exports = (app, lando) => {
  // Add the scanner to the apps
  // @TODO: eventually this should be in the util component but here for
  // backwards compat for now
  app.events.on('pre-init', () => {
    app.scanUrls = require('./lib/scanner')(app.log, app.Promise);
  });

  // Scan urls
  app.events.on('post-start', 10, () => {
    // Message to let the user know it could take a bit
    console.log('Scanning to determine which services are ready... Please standby...');
    // Filter out any services where the scanner might be disabled
    return app.scanUrls(_.flatMap(getScannable(app), 'urls'), {max: 16}).then(urls => {
      // Get data about our scanned urls
      app.urls = urls;
      // Add in unscannable ones if we have them
      if (!_.isEmpty(getScannable(app, false))) {
        app.urls = app.urls.concat(_.map(_.flatMap(getScannable(app, false), 'urls'), url => ({
          url,
          status: true,
          color: 'yellow',
        })));
      }
    });
  });
};
