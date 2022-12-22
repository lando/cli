#!/usr/bin/env node

/**
 * Main CLI entrypoint that wraps @lando/core@3 or @lando/core@4
 * This file is meant to be linked as a "lando" executable.
 *
 * @name lando
 */

/*
  1. replace landoConfig/CLI require with a minimal lives in CLI default config loader? summon CLI after runtime is determined
  2. replace bootstrap require with lives in CLI libs to replicate config building/landofile searching/get loading
  3. reduce deps and unit test?
*/

'use strict';

// do the intial debugging check with argv
const argv = require('@lando/argv');

// check for --debug and internally set DEBUG=* if its set
if ((process.env.DEBUG === undefined
  || process.env.DEBUG === null
  || process.env.DEBUG === '')
  && argv.hasOption('--debug')) {
  require('debug').enable(argv.getOption('--debug', {defaultValue: '*'}));
  process.env.NODE_ENV = 'development';
}

// now load in the minimal mod set to determine the runtime version
const debug = require('debug')('lando:@lando/cli@3:preflight');
const minstrapper = require('./../lib/minstrapper.js');
const path = require('path');
const pjson = require(path.resolve(__dirname, '..', 'package.json'));

// start the preflight
debug('starting lando version %o preflight...', pjson.version);

// allow envvars to override a few core things
// @NOTE: we've kept these around for backwards compatibility, you probably shouldnt use them
const LOGLEVELCONSOLE = process.env.LANDO_CORE_LOGLEVELCONSOLE;
const ENVPREFIX = process.env.LANDO_CORE_ENVPREFIX;
const USERCONFROOT = process.env.LANDO_CORE_USERCONFROOT;

// start by "minstrapping" the lando/app config
// primarily this means getting the MININMAL amount of stuff we need to determine the runtime to be used
let config = minstrapper.getDefaultConfig({envPrefix: ENVPREFIX, userConfRoot: USERCONFROOT});

// @NOTE: is it safe to assume configSources exists and is iterable? i think so?
for (const file of config.configSources) {
  config = minstrapper.merge(config, minstrapper.loadFile(file));
  debug('merged in additional config source from file %o', file);
}

// merge in any envvars that set things
if (config.envPrefix) {
  const data = minstrapper.loadEnvs(config.envPrefix);
  config = minstrapper.merge(config, data);
  debug('merged in additional config source from %o envvars with data %O', `${config.envPrefix}_*`, data);
}

// log minconf result
debug('final assembled minconf is %O', config);

// try to get app configuration if we can
const {preLandoFiles, landoFile, postLandoFiles, userConfRoot} = config;
const landoFiles = minstrapper.getLandoFiles([preLandoFiles, [landoFile], postLandoFiles].flat(1));
const appConfig = (landoFiles.length > 0) ? minstrapper.getApp(landoFiles, userConfRoot) : {};

// if we have an app then normalize runtime and also log some helpful stuff
if (Object.keys(appConfig).length > 0) debug('detected an app %o at %o', appConfig.name, path.dirname(landoFiles[0]));

// determine the runtime
const runtime = (appConfig.runtime === 'v4'
  || appConfig.runtime === '4'
  || appConfig.runtime === 4
  || config.runtime === 'v4'
  || config.runtime === '4'
  || config.runtime === 4
  ) ? 4: 3;

debug('using %o runtime version %o', '@lando/core', runtime);

/*
 * This is where we split into either the V3 or V4 runtime
 *
 * Note that V3 uses cli and V4 uses cli-next. It is best to think of these as different "handlers" for the same
 * CLI which is Lando CLI 3. Lando CLI 4 will use OCLIF.
 */

// THIS IS @LANDO/CLI@3 AND @LANDO/CORE@3
// THIS IS "STABLE LANDO" AND SHOULD NOT REALLY CHANGE AT THIS POINT
if (runtime === 3) {
  // Summon the implementation of @lando/cli@3 that works with @lando/core@3
  debug('starting lando with %o runtime', '@lando/core@3');
  const _ = require('lodash');
  const bootstrap = require('@lando/core/lib/bootstrap');
  const fs = require('fs');
  const Cli = require('./../lib/cli');

  const cli = new Cli(ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT);
  const bsLevel = (_.has(appConfig, 'recipe')) ? 'APP' : 'TASKS';

  // Lando cache stuffs
  process.lando = 'node';
  process.landoTaskCacheName = '_.tasks.cache';
  process.landoTaskCacheFile = path.join(cli.defaultConfig().userConfRoot, 'cache', process.landoTaskCacheName);
  process.landoAppTaskCacheFile = !_.isEmpty(appConfig) ? appConfig.toolingCache : undefined;

  // Check for sudo usage
  cli.checkPerms();

  // Check to see if we have a recipe and if it doesn't have a tooling cache lets enforce a manual cache clear
  if (bsLevel === 'APP' && !fs.existsSync(appConfig.toolingCache)) {
    if (fs.existsSync(process.landoTaskCacheFile)) fs.unlinkSync(process.landoTaskCacheFile);
  }

  // Print the cli if we've got tasks cached
  if (fs.existsSync(process.landoTaskCacheFile)) {
    cli.run(bootstrap.getTasks(appConfig, cli.argv()), appConfig);
  // Otherwise min bootstrap lando so we can generate the task cache first
  } else {
    // NOTE: we require lando down here because it adds .5 seconds if we do it above
    const Lando = require('@lando/core');
    const lando = new Lando(cli.defaultConfig(appConfig));
    // add the CLI to lando for downstream usage
    lando.cli = cli;
    // Bootstrap lando at the correct level
    lando.bootstrap(bsLevel).then(lando => {
      // If bootstrap level is APP then we need to get and init our app to generate the app task cache
      if (bsLevel === 'APP') {
        lando.getApp().init().then(() => cli.run(bootstrap.getTasks(appConfig, cli.argv()), appConfig));
      // Otherwise run as yooz
      } else {
        cli.run(bootstrap.getTasks(appConfig, cli.argv()), appConfig);
      }
    });
  }

// THIS IS @LANDO/CLI@3(ish) AND @LANDO/CORE@4
// THIS IS NOW THE HAPPENING SPOT!!!
} else if (runtime === 4) {
  debug('starting lando with %o runtime', '@lando/core@4');
  // Summon the implementation of @lando/cli@3 that works with @lando/core@3
  const _ = require('lodash');
  const bootstrap = require('@lando/core-next/lib/bootstrap');
  const fs = require('fs');
  const Cli = require('./../lib/cli-next');

  const cli = new Cli(ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT);
  const bsLevel = (_.has(appConfig, 'recipe')) ? 'APP' : 'TASKS';

  // Lando cache stuffs
  process.lando = 'node';
  process.landoTaskCacheName = '_.tasks.cache';
  process.landoTaskCacheFile = path.join(cli.defaultConfig().userConfRoot, 'cache', process.landoTaskCacheName);
  process.landoAppTaskCacheFile = !_.isEmpty(appConfig) ? appConfig.toolingCache : undefined;

  // Check for sudo usage
  cli.checkPerms();

  // Check to see if we have a recipe and if it doesn't have a tooling cache lets enforce a manual cache clear
  if (bsLevel === 'APP' && !fs.existsSync(appConfig.toolingCache)) {
    if (fs.existsSync(process.landoTaskCacheFile)) fs.unlinkSync(process.landoTaskCacheFile);
  }

  // Print the cli if we've got tasks cached
  if (fs.existsSync(process.landoTaskCacheFile)) {
    cli.run(bootstrap.getTasks(appConfig, cli.argv()), appConfig);
  // Otherwise min bootstrap lando so we can generate the task cache first
  } else {
    // NOTE: we require lando down here because it adds .5 seconds if we do it above
    const Lando = require('@lando/core-next');
    const lando = new Lando(cli.defaultConfig(appConfig));
    // add the CLI to lando for downstream usage
    lando.cli = cli;
    // Bootstrap lando at the correct level
    lando.bootstrap(bsLevel).then(lando => {
      // If bootstrap level is APP then we need to get and init our app to generate the app task cache
      if (bsLevel === 'APP') {
        lando.getApp().init().then(() => cli.run(bootstrap.getTasks(appConfig, cli.argv()), appConfig));
      // Otherwise run as yooz
      } else {
        cli.run(bootstrap.getTasks(appConfig, cli.argv()), appConfig);
      }
    });
  }
}
