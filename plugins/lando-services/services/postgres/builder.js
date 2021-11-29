'use strict';

// Modules
const _ = require('lodash');

/*
 * Apache for all
 */
module.exports = {
  name: 'postgres',
  config: {
    version: '10',
    supported: ['14', '13', '12', '11', '11.1', '11.0', '10', '10.6.0', '9.6'],
    pinPairs: {
      '14': 'bitnami/postgresql:14.1.0-debian-10-r9',
      '13': 'bitnami/postgresql:13.5.0-debian-10-r9',
      '12': 'bitnami/postgresql:12.9.0-debian-10-r9',
      '11': 'bitnami/postgresql:11.14.0-debian-10-r9',
      '10': 'bitnami/postgresql:10.19.0-debian-10-r9',
      '9.6': 'bitnami/postgresql:9.6.24-debian-10-r9',
    },
    patchesSupported: true,
    confSrc: __dirname,
    creds: {
      database: 'database',
    },
    healthcheck: 'psql -U postgres -c "\\\l"',
    port: '5432',
    defaultFiles: {
      database: 'postgresql.conf',
    },
    remoteFiles: {
      database: '/bitnami/postgresql/conf/conf.d/lando.conf',
    },
  },
  parent: '_service',
  builder: (parent, config) => class LandoPostgres extends parent {
    constructor(id, options = {}) {
      options = _.merge({}, config, options);
      // The Bitnami Postgres container is particular about the user/pass.
      options.creds.user = 'postgres';
      options.creds.password = '';
      // Ensure the non-root backup perm sweep runs
      // NOTE: we guard against cases where the UID is the same as the bitnami non-root user
      // because this messes things up on circle ci and presumably elsewhere and _should_ be unncessary
      if (_.get(options, '_app._config.uid', '1000') !== '1001') options._app.nonRoot.push(options.name);

      const postgres = {
        image: `bitnami/postgresql:${options.version}`,
        command: '/launch.sh',
        environment: {
          ALLOW_EMPTY_PASSWORD: 'yes',
          POSTGRESQL_DATABASE: options.creds.database,
          POSTGRES_DB: options.creds.database,
          LANDO_NEEDS_EXEC: 'DOEEET',
        },
        volumes: [
          `${options.confDest}/launch.sh:/launch.sh`,
          `${options.confDest}/${options.defaultFiles.database}:${options.remoteFiles.database}`,
          `${options.data}:/bitnami/postgresql`,
        ],
      };
      // Send it downstream
      super(id, options, {services: _.set({}, options.name, postgres)});
    };
  },
};
