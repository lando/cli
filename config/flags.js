'use strict';

const {Flags} = require('@oclif/core');

module.exports = {
  oclif: {
    'channel': Flags.string({
      hidden: true,
      helpGroup: 'GLOBAL',
    }),
    'config': Flags.string({
      char: 'c',
      description: 'use configuration from specified file',
      env: 'LANDO_CONFIG_FILE',
      default: undefined,
      helpGroup: 'GLOBAL',
    }),
    'experimental': Flags.boolean({hidden: false}),
    'secret-toggle': Flags.boolean({hidden: false}),
  },
  yargs: {
    channel: {
      describe: 'set the update channel',
      choices: ['edge', 'none', 'stable'],
      global: true,
      hidden: true,
      type: 'array',
    },
    clear: {
      describe: 'clear registry and task caches',
      global: true,
      type: 'boolean',
    },
    debug: {
      describe: 'show debug output',
      global: true,
      type: 'boolean',
    },
    experimental: {
      global: true,
      hidden: true,
      type: 'boolean',
    },
    help: {
      describe: 'show lando or delegated command help if applicable',
      type: 'boolean',
    },
    lando: {
      hidden: true,
      type: 'boolean',
    },
    verbose: {
      alias: 'v',
      describe: 'run with extra verbosity',
      global: true,
      hidden: true,
      type: 'count',
    },
  },
};
