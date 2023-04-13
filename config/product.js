'use strict';

const fs = require('fs');
const path = require('path');

module.exports = options => {
  // start by figuring out the "core" location
  const exCore = path.join(options.dataDir, 'plugins', '@lando', 'core-next');
  options.coreDir = fs.existsSync(exCore) ? exCore : '@lando/core-next';

  // and where we should dump the result of the config
  options.configCache = path.join(options.cacheDir, `${options.id}-config.json`);
  // now that options is sort of set, get some stuff we need from it
  const {configCache, configDir, configFile, coreDir, dataDir, env, id, logger} = options;
  // @NOTE: do we think it makes sense to use coreDir for this? it seems to be a bit slower?
  // and potentially it could be less? stable
  const Config = require(`${coreDir}/lib/config`);
  const Templator = require(`${coreDir}/lib/templator`);

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
  if (configFile) config.overrides('userfile', Config.read(configFile), {encode: false});
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
