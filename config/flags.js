'use strict';

const {Flags} = require('@oclif/core');

module.exports = {
  oclif: {
    'channel': Flags.string({hidden: true}),
    'clear': Flags.boolean({hidden: false}),
    'config': Flags.string({
      char: 'c',
      description: 'use configuration from specified file',
      env: 'LANDO_CONFIG_FILE',
      default: undefined,
      helpGroup: 'GLOBAL',
    }),
    'debug': Flags.boolean({hidden: true}),
    'experimental': Flags.boolean({hidden: false}),
    'no-cache': Flags.boolean({hidden: false}),
    'secret-toggle': Flags.boolean({hidden: false}),
  },
  yargs: {
    'channel': {
      choices: ['edge', 'none', 'stable'],
      global: true,
      hidden: true,
      type: 'array',
    },
    'clear': {
      global: true,
      hidden: true,
      type: 'boolean',
    },
    'debug': {
      describe: 'show debug output',
      global: true,
      type: 'boolean',
    },
    'experimental': {
      global: true,
      hidden: true,
      type: 'boolean',
    },
    'help': {
      describe: 'show lando or delegated command help if applicable',
      type: 'boolean',
    },
    'no-cache': {
      global: true,
      describe: 'disable and flush cache',
      type: 'boolean',
    },
    'lando': {
      hidden: true,
      type: 'boolean',
    },
    'verbose': {
      alias: 'v',
      global: true,
      hidden: true,
      type: 'count',
    },
  },
};
