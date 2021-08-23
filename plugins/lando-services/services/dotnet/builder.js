'use strict';

// Modules
const _ = require('lodash');

// Builder
module.exports = {
  name: 'dotnet',
  config: {
    version: '2.1',
    supported: ['3.1', '2.1'],
    patchesSupported: false,
    command: 'tail -f /dev/null',
    path: [
      '/usr/local/sbin',
      '/usr/local/bin',
      '/usr/sbin',
      '/usr/bin',
      '/sbin',
      '/bin',
    ],
    port: '80',
    ssl: false,
    volumes: [
      '/usr/local/bin',
      '/usr/local/share',
      '/usr/local/bundle',
    ],
  },
  parent: '_appserver',
  builder: (parent, config) => class LandoDotNet extends parent {
    constructor(id, options = {}) {
      options = _.merge({}, config, options);
      // Make sure our command is an array
      if (!_.isArray(options.command)) options.command = [options.command];
      options.command = options.command.join(' && ');

      // Build the dotnet
      const dotnet = {
        image: `mcr.microsoft.com/dotnet/sdk:${options.version}`,
        environment: {
          PATH: options.path.join(':'),
          ASPNETCORE_URLS: `http://+:${options.port}`,
        },
        ports: (options.command !== 'tail -f /dev/null') ? [options.port] : [],
        volumes: options.volumes,
        command: `/bin/sh -c "${options.command}"`,
      };
      // Send it downstream
      super(id, options, {services: _.set({}, options.name, dotnet)});
    };
  },
};
