'use strict';

/*
 * Helper to get the `lando mysql` command for the Pantheon recipe.
 */
exports.getPantheonMySql = {
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
