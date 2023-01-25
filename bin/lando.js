#!/usr/bin/env node

/**
 * Main CLI entrypoint that wraps @lando/core@3 or @lando/core@4
 * This file is meant to be linked as a "lando" executable.
 *
 * @name lando
 */

'use strict';

// do the intial debugging check with argv
const argv = require('@lando/argv');

// helper to determine whether DEBUG is set
const isDebugging = (process.env.DEBUG === undefined || process.env.DEBUG === null || process.env.DEBUG === '') !== true;

// check for --debug and internally set DEBUG=* if its set
if (!isDebugging && argv.hasOption('--debug')) {
  require('debug').enable(argv.getOption('--debug', {defaultValue: '*'}));
}

// now load in the minimal mod set to determine the runtime version
const debug = require('debug')('lando:@lando/cli:preflight');
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
  // get oclif
  const oclif = require('@oclif/core');

  // handle legacy --verbose flags
  if (!isDebugging &&
    (argv.hasOption('--verbose')
    || argv.hasOption('-v')
    || argv.hasOption('-vv')
    || argv.hasOption('-vvv')
    || argv.hasOption('-vvvv'))) {
    require('debug').enable('*');
  }

  // Set the OCLIF debug flag
  // we do a different check here because process.env.DEBUG should be set above
  if (process.env.DEBUG) oclif.settings.debug = true;

  // get what we need for cli-next
  const cacheDir = path.join(minstrapper.getOclifCacheDir(config.product), 'cli');
  debug('starting lando with %o runtime using cli-next cache dir %o', `v${runtime}`, cacheDir);

  // get the cli
  const Cli = require('./../lib/cli-next');

  // @NOTE: cli-next now allows hooks to be passed directly into the constructor. we do this because there are some
  // hooks eg init, init-preflight that run BEFORE we get the registry and the hooks that plugins have contributed
  // right now the only way to "access" these hooks is with oclif directly in the package.json.
  // @TODO: should we have some sort of "early hook" loader so that we can pass them in here? i feel like that would
  // be pretty difficult and is of questionable value?
  const cli = new Cli({cacheDir, product: config.product});

  // run our oclifish CLI
  cli.run().then(require('@oclif/core/flush')).catch(require('@oclif/core/handle'));

// THIS IS @LANDO/CLI@3 AND @LANDO/CORE@3
// THIS IS "STABLE LANDO" AND SHOULD NOT REALLY CHANGE AT THIS POINT
} else if (runtime === 3) {
  // Summon the implementation of @lando/cli@3 that works with @lando/core@3
  debug('starting lando with %o runtime using cli %o', `v${runtime}`, {ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT});
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
}
