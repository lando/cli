#!/usr/bin/env node

/**
 * Main CLI entrypoint that wraps @lando/core@3 or @lando/core@4
 * This file is meant to be linked as a lando "executable".
 *
 * @name lando
 */

'use strict';

// mods
const argv = require('@lando/argv');
const path = require('path');

// if DEBUG is set then unset it, we dont want it to toggle any debugging inside of lando
// @NOTE: are we sure? or at the very least are we sure dont want to do something with its value?
if (process.env.DEBUG) delete process.env.DEBUG;

// start assessing debug situation with LANDO_DEBUG
if (process.env.LANDO_DEBUG) {
  const scope = process.env.LANDO_DEBUG === 1
    || process.env.LANDO_DEBUG === '1'
    || process.env.LANDO_DEBUG === true
    || process.env.LANDO_DEBUG === 'true' ? 'lando*' : process.env.LANDO_DEBUG;
  require('debug').enable(scope);
}

// @NOTE: reconsider this when we have lando 4 arg parsing? or have that just be a lando 4 thing?
// then handle legacy --verbose flags next
// if (argv.hasOption('--verbose')
//   || argv.hasOption('-v')
//   || argv.hasOption('-vv')
//   || argv.hasOption('-vvv')
//   || argv.hasOption('-vvvv')) {
//   require('debug').enable('lando*');
// }

// and finally prefer --debug
if (argv.hasOption('--debug')) {
  require('debug').enable(argv.getOption('--debug', {defaultValue: 'lando*'}));
}

// debugger
const id = path.basename(process.argv[1]);
const debug = require('@lando/core-next/debug')(id || 'lando');

// now load in the runtime selector
const rts = require('../lib/rts');
const pjson = require(path.resolve(__dirname, '..', 'package.json'));

// start the preflight
debug('starting %o version %o runtime selector...', id, pjson.version);

// allow envvars to override a few core things
// @NOTE: we've kept these around for backwards compatibility, you probably shouldnt use them though
const LOGLEVELCONSOLE = process.env.LANDO_CORE_LOGLEVELCONSOLE || debug.enabled ? 4 : undefined;
const ENVPREFIX = process.env.LANDO_CORE_ENVPREFIX;
const USERCONFROOT = process.env.LANDO_CORE_USERCONFROOT;
const RUNTIME = process.env.LANDO_CORE_RUNTIME;

// start by "minstrapping" the lando/app config
// primarily this means getting the MININMAL amount of stuff we need to determine the runtime to be used
let config = rts.getDefaultConfig({envPrefix: ENVPREFIX, runtime: RUNTIME, userConfRoot: USERCONFROOT});

// @NOTE: is it safe to assume configSources exists and is iterable? i think so?
for (const file of config.configSources) {
  config = rts.merge(config, rts.loadFile(file));
  debug('merged in additional config source from file %o', file);
}

// merge in any envvars that set things
if (config.envPrefix) {
  const data = rts.loadEnvs(config.envPrefix);
  config = rts.merge(config, data);
  debug('merged in additional config source from %o envvars with data %o', `${config.envPrefix}_*`, data);
}

// log minconf result
debug('final assembled minconf is %O', config);

// try to get app configuration if we can
const {preLandoFiles, landoFile, postLandoFiles, userConfRoot} = config;

const landoFiles = rts.getLandoFiles([preLandoFiles, [landoFile], postLandoFiles].flat(1));
const appConfig = (landoFiles.length > 0) ? rts.getApp(landoFiles, userConfRoot) : {};

// if we have an app then normalize runtime and also log some helpful stuff
if (Object.keys(appConfig).length > 0) debug('detected an app %o at %o', appConfig.name, path.dirname(landoFiles[0]));

// determine the runtime
const rawRuntime = appConfig.runtime || config.runtime || 3;
const runtime = (rawRuntime === 'v4' || rawRuntime === '4' || rawRuntime === 4) ? 4: 3;
debug('using %o runtime version %o', '@lando/core', runtime);

/*
 * This is where we split into either the V3 or V4 runtime
 *
 * Note that V3 uses cli and V4 uses cli-next. It is best to think of these as different "handlers" for the same
 * CLI which is Lando CLI 3. Lando CLI 4 will use OCLIF.
 */
// THIS IS @LANDO/CLI@3(ish) AND @LANDO/CORE@4
// THIS IS NOW THE HAPPENING SPOT!!!

if (runtime === 4) {
  // Set the OCLIF debug flag
  // we do a different check here because process.env.DEBUG should be set above
  if (debug.enabled) {
    const oclif = require('@oclif/core');
    oclif.settings.debug = true;
  }

  // get what we need for cli-next
  const cache = !argv.hasOption('--clear') && !argv.hasOption('--no-cache');
  const cacheDir = `${rts.getOclifCacheDir(config.product)}.cli`;
  debug('handing off to %o with caching %o at %o and debug %o', '@lando/cli@4', cache ? 'enabled' : 'disabled', cacheDir, debug.enabled);

  // get the cli
  const Cli = require('./../lib/cli-next');
  // override some default static props
  Cli.debug = debug.extend('cli');
  Cli.id = config.product;

  // @NOTE: cli-next now allows hooks to be passed directly into the constructor. we do this because there are some
  // hooks eg init, init-preflight that run BEFORE we get the registry and the hooks that plugins have contributed
  // right now the only way to "access" these hooks is with oclif directly in the package.json.
  // @TODO: should we have some sort of "early hook" loader so that we can pass them in here? i feel like that would
  // be pretty difficult and is of questionable value?
  // @TODO: what about minstrapper stuff?
  const cli = new Cli({cache, cacheDir, debug});

  // run our oclifish CLI
  cli.run().then(require('@oclif/core/flush')).catch(require('@oclif/core/handle'));

// THIS IS @LANDO/CLI@3 AND @LANDO/CORE@3
// THIS IS "STABLE LANDO" AND SHOULD NOT REALLY CHANGE AT THIS POINT
} else if (runtime === 3) {
  const _ = require('lodash');
  const fs = require('fs');

  // compute path to external core
  const extCore = path.join(config.userConfRoot, 'plugins', '@lando', 'core');
  // if appConfig points to a different core lets set that here
  if (typeof _.get(appConfig, 'plugins.@lando/core') === 'string') {
    appConfig.appCore = path.resolve(appConfig.root, appConfig.plugins['@lando/core']);
  }

  // by default core is in node_modules
  let COREBASE = '@lando/core';
  // but if its in the user plugins dir use that instead
  if (fs.existsSync(path.join(extCore, 'index.js'))) COREBASE = extCore;
  // but if its referenced in the appConfig then actually use that instead
  if (appConfig.appCore && fs.existsSync(path.join(appConfig.appCore, 'index.js'))) COREBASE = appConfig.appCore;

  // Summon the implementation of @lando/cli@3 that works with @lando/core@3
  const Cli = require('./../lib/cli');
  const cli = new Cli(ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT, COREBASE);
  const bsLevel = (_.has(appConfig, 'recipe')) ? 'APP' : 'TASKS';
  const getTasks = require(`${COREBASE}/utils/get-tasks`);
  debug('starting lando with %o runtime using cli %o', `v${runtime}`, {ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT, COREBASE});

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
    cli.run(getTasks(appConfig, cli.argv()), appConfig);
  // Otherwise min bootstrap lando so we can generate the task cache first
  } else {
    // NOTE: we require lando down here because it adds .5 seconds if we do it above
    const Lando = require(COREBASE);
    const lando = new Lando(cli.defaultConfig(appConfig));
    // add the CLI to lando for downstream usage
    lando.cli = cli;
    // Bootstrap lando at the correct level
    lando.bootstrap(bsLevel).then(lando => {
      // If bootstrap level is APP then we need to get and init our app to generate the app task cache
      if (bsLevel === 'APP') {
        lando.getApp().init().then(() => cli.run(getTasks(appConfig, cli.argv()), appConfig));
      // Otherwise run as yooz
      } else {
        cli.run(getTasks(appConfig, cli.argv()), appConfig);
      }
    });
  }
}
