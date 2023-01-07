const debug = require('debug')('lando:@lando/cli:hooks:init');
const fs = require('fs');
const path = require('path');

const {Flags, Parser} = require('@oclif/core');

module.exports = async ({id, argv, config}) => {
  // before we begin lets check some requirements out
  await config.runHook('init-preflight', {id, argv, config});

  // get the status of some global flags
  const {clear} = config.cli.argv();
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

  // determine which loader to use
  // @NOTE: this assumes the user has not changed the user global plugin dir
  const internalBase = path.join(__dirname, '..', 'node_modules', '@lando', 'core-next');
  const externalBase = path.join(config.dataDir, 'plugins', '@lando', 'core-next');
  const coreBase = fs.existsSync(externalBase) ? externalBase : internalBase;

  // start the lando config by setting the default bootstrapper and its config
  const systemTemplate = path.join(__dirname, '..', 'config', 'system.js');
  const userTemplate = path.join(__dirname, '..', 'config', 'user.yaml');
  const minstrapper = {
    loader: path.join(coreBase, 'core', 'bootstrap.js'),
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

  // minstrap hook
  //
  // @NOTE: the minstrapper is a lightweight thing that loads the main bootstrapper. it exists primarily so that
  // lando can be modified at a very core level. this is useful if you want to distribute your own lando
  // with a different name, config set, and different "pre command" runtime.
  //
  // to that end you will want to add an OCLIF plugin and hook into the "minstrapper" event. you can replace the
  // minstrapper there. note that your event will have access to both config and lando
  //
  await config.runHook('init-setup', {minstrapper});
  debug('init-setup complete, using %o as bootstrapper', minstrapper.loader);

  // get the boostrapper and run it
  const Bootstrapper = require(minstrapper.loader);
  const bootstrap = new Bootstrapper({config: minstrapper.config, noCache: clear});

  // Initialize
  try {
    await bootstrap.run(config);
    debug('init-setup completed successfully!');
  } catch (error) {
    console.error('Bootstrap failed!'); // eslint-disable-line no-console
    config.hookError(error);
  }

  // hook to modify the config
  await config.runHook('init-config', {id, argv});

  // lando and cli should be "ready" by now, lets get them
  const {lando, cli} = config;

  // determine if we have an app or not
  const landofile = lando.config.get('core.landofile');
  const landofiles = [`${landofile}.yaml`, `${landofile}.yml`];
  const landofilePath = lando.findApp(landofiles, process.cwd());

  // if we have an file then lets set some things in the config for downstream purposes
  if (fs.existsSync(landofilePath)) {
    const MinApp = require(path.join(coreBase, 'core', 'minapp'));
    const minapp = new MinApp({landofile: landofilePath, noCache: clear, config: lando.config});
    // set and report
    config.minapp = minapp;
    debug('discovered an app called %o at %o', config.minapp.name, path.dirname(landofilePath));

    // a special event that runs only when we have an app
    await config.runHook('init-app', {id, argv});
  }

  // determine the context
  config.context = {app: config.minapp !== undefined, global: config.minapp === undefined};
  debug('command is running with context %o', config.context);

  // get the stuff we just made to help us get the tasks
  const {context, minapp} = config;

  // compute the task cache ids
  config.tasksCacheId = context.app ? minapp.id : lando.config.get('system.instance');

  // get the tasks list and help
  const registry = context.app ? minapp.getRegistry() : lando.getRegistry();
  config.tasks = cli.getTasks({id: config.tasksCacheId, noCache: clear, registry}, [lando, cli]);

  // if we do the above then we should have what we need in lando.registry or app.registry
  await config.runHook('init-tasks', {id, argv, tasks: config.tasks});

  // final hook to do stuff to the init
  await config.runHook('init-final', config);
};
