'use strict';

const fs = require('fs');
const path = require('path');

module.exports = options => {
  // cache option?
  // how would that work? does user configfile bust it?

  console.log(options);
  process.exit(1)

  // start by moving in
  // configuration templates
  const templates = {
    system: {source: systemTemplate, dest: path.join(config.dataDir, 'system.json'), replace: true},
    global: {data: {}, dest: path.join(config.dataDir, 'global.json')},
    user: {source: userTemplate, dest: path.join(config.configDir, 'config.yaml')},
  };


  // then start the config?

  //
  const sources = {

  }




  // start the lando config by setting the default bootstrapper and its config
  const systemTemplate = path.join(__dirname, '..', 'config', 'system.js');
  const userTemplate = path.join(__dirname, '..', 'config', 'user.yaml');

  return {
    product: path.join(coreBase, 'components', 'lando.js'),
    config: {
      argv,
      cache,
      cached: path.join(config.cacheDir, 'config.json'),
      env: id.toUpperCase(),
      id,
      managed: 'global',
      // add oclif config so we can use it in our js templates
      oclif: config,
      // sources are loading in increasing priority into the main config
      sources: {
        system: path.join(config.dataDir, 'system.json'),
        global: path.join(config.dataDir, 'global.json'),
        user: path.join(config.configDir, 'config.yaml'),
        overrides: configFile && fs.existsSync(configFile) ? path.resolve(configFile) : undefined,
      },
      // templates can prepopulate or override sources before they are loaded
      templates: {
        system: {source: systemTemplate, dest: path.join(config.dataDir, 'system.json'), replace: true},
        global: {data: {}, dest: path.join(config.dataDir, 'global.json')},
        user: {source: userTemplate, dest: path.join(config.configDir, 'config.yaml')},
      },
    },
  };
};
