'use strict';

const fs = require('fs');
const path = require('path');

// const Config = require('@lando/core-next/config');
// const Templator = require('@lando/core-next/Templator');

module.exports = options => {
  // start by figuring out the "core" location
  // @NOTE: we prefer external core over the internal one for cases where core has been updated externally or
  // if core is being developed
  const inCore = path.resolve(__dirname, '..', 'node_modules', '@lando', 'core-next');
  const exCore = path.join(options.dataDir, 'plugins', '@lando', 'core-next');
  options.coreDir = fs.existsSync(exCore) ? exCore : inCore;
  // and where we should dump the result of the config
  options.configCache = path.join(options.cacheDir, `${options.id}-config.json`);

  // now that options is sort of set, get some stuff we need from it
  const {configCache, configDir, configFile, dataDir, env, id, logger} = options;

  // get core location dependent deps
  // @NOTE: we can probably get rid of this for things like Config/Templator once they are in a stable state
  // just like we invoke debug directly in bin/lando.js
  const Config = require(`${options.coreDir}/lib/config`);
  const Templator = require(`${options.coreDir}/lib/templator`);
  const read = require(`${options.coreDir}/utils/read-file`);

  // configuration templates we need to create
  const templates = [
    // a "system" config file which should always be overwritten because the defaults might change esp right now
    [path.join(__dirname, 'system.js'), path.join(dataDir, 'system.json'), {debug: logger.extend('templator'), overwrite: true}],
    // a "global" config file that the product itself can manage
    [path.join(__dirname, 'global.js'), path.join(dataDir, 'global.json'), {debug: logger.extend('templator')}],
    // a "user" config file that can be manually edited by the user
    [path.join(__dirname, 'user.yaml'), path.join(configDir, 'config.yaml'), {debug: logger.extend('templator')}],
  ];

  // loop through and generate our templates as needed
  templates.map(targs => new Templator(...targs)).map(template => template.generate(options));

  // start our config collection and load config sources in decreasing priority
  const config = new Config({cached: configCache, debug: logger.extend('minstrapper-config'), env, id, managed: 'global'});

  // if we have a CLI provided config source then thats first
  if (configFile) config.overrides('userfile', read(configFile), {encode: false});
  // then load in product envvars
  config.env(id);
  // then the user config
  config.file('user', path.join(configDir, 'config.yaml'));
  // then the global/managed config
  config.file('global', path.join(dataDir, 'global.json'));
  // then system configuration
  config.file('system', path.join(dataDir, 'system.json'));
  // dump cache
  config.dump();

  // return
  return config;
};
