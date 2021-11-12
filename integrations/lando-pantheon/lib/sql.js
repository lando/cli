'use strict';

// Modules
const _ = require('lodash');
const path = require('path');

// Default DB cli commands
const mysqlCli = {
  service: ':host',
  description: 'Drops into a MySQL shell on a Pantheon database service',
  cmd: 'mysql -uroot',
  options: {
    host: {
      description: 'The database service to use',
      default: 'database',
      alias: ['h'],
    },
  },
};
const postgresCli = {
  service: ':host',
  description: 'Drops into a psql shell on a database service',
  cmd: 'psql -Upostgres',
  user: 'root',
  options: {
    host: {
      description: 'The database service to use',
      default: 'database',
      alias: ['h'],
    },
  },
};

/*
 * Helper to get the correct DB tool.
 */
exports.getPantheonSql = database => {
  // Make sure we strip out any version number
  database = database.split(':')[0];
  // Choose wisely
  if (_.includes(['mysql', 'mariadb', 'pantheon-mariadb'], database)) {
    return {mysql: mysqlCli};
  } else if (database === 'postgres') {
    return {psql: postgresCli};
  } else if (database === 'mongo') {
    return {mongo: {
      service: 'database',
      description: 'Drop into the mongo shell',
    }};
  }
};
