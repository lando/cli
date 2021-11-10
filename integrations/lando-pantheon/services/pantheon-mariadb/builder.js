'use strict';

// Modules
const _ = require('lodash');

// Builder
module.exports = {
  name: 'pantheon-mariadb',
  config: {
    version: '10.4',
    supported: ['10.4', '10.3'],
    pinPairs: {
      '10.4': 'mariadb:10.4.21',
      '10.3': 'mariadb:10.3.31',
    },
    patchesSupported: true,
    confSrc: __dirname,
    creds: {
      database: 'pantheon',
      password: 'pantheon',
      user: 'pantheon',
    },
    healthcheck: 'mysql -uroot --silent --execute "SHOW DATABASES;"',
    port: '3306',
    defaultFiles: {
      database: 'my_custom.cnf',
    },
    remoteFiles: {
      database: '/etc/mysql/cnf.d/my_custom.cnf',
    },
  },
  parent: '_service',
  builder: (parent, config) => class LandoMariaDb extends parent {
    constructor(id, options = {}) {
      options = _.merge({}, config, options);
      // @TODO: Delete?
      // Ensure the non-root backup perm sweep runs
      // NOTE: we guard against cases where the UID is the same as the non-root user
      // because this messes things up on circle ci and presumably elsewhere and _should_ be unncessary
      if (_.get(options, '_app._config.uid', '1000') !== '1001') options._app.nonRoot.push(options.name);

      const mariadb = {
        image: `mariadb:${options.version}`,
        //command: '/launch.sh', @TODO: do we need something here?
        environment: {
          MARIADB_ALLOW_EMPTY_ROOT_PASSWORD: 'yes',
          // MARIADB_EXTRA_FLAGS for things like coallation?
          MARIADB_DATABASE: options.creds.database,
          MARIADB_PASSWORD: options.creds.password,
          MARIADB_USER: options.creds.user,
          LANDO_NEEDS_EXEC: 'DOEEET',
        },
        volumes: [
          `${options.confDest}/launch.sh:/launch.sh`,
          `${options.confDest}/${options.defaultFiles.database}:${options.remoteFiles.database}`,
          `${options.data}:/var/lib/mariadb`,
        ],
      };
      // Send it downstream
      super(id, options, {services: _.set({}, options.name, mariadb)});
    };
  },
};
