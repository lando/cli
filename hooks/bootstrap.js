const debug = require('debug')('lando:@lando/cli@3:hooks:init');
const fs = require('fs');
const path = require('path');

const {Flags, Parser} = require('@oclif/core');

module.exports = async ({id, argv, config}) => {
  // run the preflight checks
  await config.runHook('bootstrap-preflight', config);

  // preemptively do a basic check for the config flag
  const {flags} = await Parser.parse(argv, {strict: false, flags: {config: Flags.string({
    char: 'c',
    description: 'use configuration from specified file',
    env: 'LANDO_CONFIG_FILE',
    default: undefined,
    helpGroup: 'GLOBAL',
  })}});

  // debug if flag config file doesnt exist
  // @NOTE: should this be a proper error?
  if (flags.config && !fs.existsSync(flags.config)) {
    debug('tried to load %s into config but it doesnt exist', flags.config);
  }

  // start the hyperdrive config by setting the default bootstrapper and its config
  const systemTemplate = path.join(__dirname, '..', 'config', 'system.js');
  const userTemplate = path.join(__dirname, '..', 'config', 'user.yaml');
  const minstrapper = {
    // config: {},
    loader: path.join(__dirname, '..', 'node_modules', '@lando', 'core-next', 'core', 'bootstrap.js'),
    config: {
      cached: path.join(config.cacheDir, 'config.json'),
      env: 'LANDO',
      id: 'lando',
      managed: 'global',
      // add oclif config so we can use it in our js templates
      oclif: config,
      // sources are loading in increasing priority into the main config
      sources: {
        system: path.join(config.dataDir, 'system.json'),
        global: path.join(config.dataDir, 'global.json'),
        user: path.join(config.configDir, 'config.yaml'),
        overrides: flags.config && fs.existsSync(flags.config) ? path.resolve(flags.config) : undefined,
      },
      // templates can prepopulate or override sources before they are loaded
      templates: {
        system: {source: systemTemplate, dest: path.join(config.dataDir, 'system.json'), replace: true},
        global: {data: {}, dest: path.join(config.dataDir, 'global.json')},
        user: {source: userTemplate, dest: path.join(config.configDir, 'config.yaml')},
      },
    },
  };

  // check to see if we have a custom config file?

  // minstrap hook
  //
  // @NOTE: the minstrapper is a lightweight thing that loads the main bootstrapper. it exists primarily so that
  // hyperdrive can be modified at a very core level. this is useful if you want to distribute your own hyperdrive
  // with a different name, config set, and different "pre command" runtime.
  //
  // to that end you will want to add an OCLIF plugin and hook into the "minstrapper" event. you can replace the
  // minstrapper there. note that your even twill have access to both config and hyperdrive
  //
  await config.runHook('bootstrap-setup', {minstrapper, config});
  debug('bootstrap-setup complete, using %o as bootstrapper', minstrapper.loader);

  // get the boostrapper and run it
  const Bootstrapper = require(minstrapper.loader);
  const bootstrap = new Bootstrapper(minstrapper.config);

  // Initialize
  try {
    await bootstrap.run(config);
    debug('bootstrap-setup completed successfully!');
  } catch (error) {
    console.error('Bootstrap failed!'); // eslint-disable-line no-console
    hookHandler(error);
  }

  // final hooks to modify the config, all representing different bootstrap considerations
  // @TODO: better define what pre-post mean?
  // @TODO: do we need to assess the failure status of these events like we do with bootstrap-preflight?
  // @NOTE: seems like at the very least we could print the debug output?
  // @NOTE: could we wrap events in some other function that handles this the way we want?
  await config.runHook('bootstrap-config-pre', config);
  await config.runHook('bootstrap-config', config);
  await config.runHook('bootstrap-config-post', config);

  // intended to discover/load/init plugins
  await config.runHook('bootstrap-plugins-pre', config);
  await config.runHook('bootstrap-plugins', config);
  await config.runHook('bootstrap-plugins-post', config);

  // intended to discover/load/init the app
  await config.runHook('bootstrap-app-pre', config);
  await config.runHook('bootstrap-app', config);
  await config.runHook('bootstrap-app-post', config);

  // intended to discover/load/init additional commands
  await config.runHook('bootstrap-commmands-pre', config);
  await config.runHook('bootstrap-commmands', config);
  await config.runHook('bootstrap-commmands-post', config);

  // intended for any final config considerations
  await config.runHook('bootstrap-final', config);
};
