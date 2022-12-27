const debug = require('debug')('lando:@lando/cli@3:hooks:init');
const fs = require('fs');
const path = require('path');

const {Flags, Parser} = require('@oclif/core');

module.exports = async ({id, argv, config}) => {
  // before we begin lets check some requirements out
  await config.runHook('init-preflight', config);

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

  // start the lando config by setting the default bootstrapper and its config
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
  await config.runHook('init-setup', {minstrapper, config});
  debug('init-setup complete, using %o as bootstrapper', minstrapper.loader);

  // get the boostrapper and run it
  const Bootstrapper = require(minstrapper.loader);
  const bootstrap = new Bootstrapper(minstrapper.config);

  // Initialize
  try {
    await bootstrap.run(config);
    debug('init-setup completed successfully!');
  } catch (error) {
    console.error('Bootstrap failed!'); // eslint-disable-line no-console
    config.hookError(error);
  }

  // final hooks to modify the init, all representing different but to be defined more clearly considerations
  await config.runHook('init-config', config);
  await config.runHook('init-plugins', config);
  await config.runHook('init-tasks', config);
  await config.runHook('init-app', config);
  await config.runHook('init-final', config);
};
