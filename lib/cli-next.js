'use strict';

// modules
const chalk = require('chalk');
const formatters = require('./formatters');
const fs = require('fs');
const get = require('lodash/get');
const gflags = require('./../config/flags');
const os = require('os');
const path = require('path');
const sortBy = require('lodash/sortBy');
const yargs = require('yargs');

// storage backends
const FileStorage = require('@lando/core-next/file-storage');
const NoStorage = require('@lando/core-next/no-storage');

// OCLIF pieces we need
const {format, inspect} = require('util');
const {normalizeArgv} = require('@oclif/core/lib/help');
const {CliUx, Config, Errors, Parser} = require('@oclif/core');

// global options
const globalOptions = gflags.yargs;

/*
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
process.stdout.on('error', err => {
  if (err && err.code === 'EPIPE') return;
  throw err;
});

/*
 * Construct the CLI
 */
module.exports = class Cli {
  static id = 'lando';
  static debug = require('debug')('@lando/cli');

  #_cache

  constructor({
    id = Cli.id,
    cache = true,
    cacheDir = path.join(os.tmpdir(), Cli.id),
    cid = Cli.id,
    debug = Cli.debug,
    hooks = [],
  } = {}) {
    // props
    this.cache = cache;
    this.debug = debug;
    this.hooks = hooks;
    this.id = id || path.basename(process.argv[1]) || 'lando';
    this.cid = this.id || cid;

    // select correct storage backend and setup cache
    const StorageBackend = this.cache ? FileStorage : NoStorage;
    this.#_cache = new StorageBackend(({debug: debug.extend('#cache'), dir: cacheDir}));
    // if cache is disabled and cachedir exist then flush it
    if (!this.cache && fs.existsSync(cacheDir)) FileStorage.flush(cacheDir, debug.extend('#flush'));

    // add the CLIUX module from OCLIF
    this.ux = CliUx;
  }

  /**
   * Returns a parsed array of CLI arguments and options
   *
   * @since 3.0.0
   * @alias lando.cli.argv
   * @return {Object} Yarg parsed options
   * @example
   * const argv = lando.cli.argv();
   * @todo make this static and then fix all call sites
   */
  argv() {
    return require('yargs').help(false).version(false).argv;
  };

  async catch(err) {
    process.exitCode = process.exitCode ?? err.exitCode ?? 1;
    if (!err.message) throw err;
    try {
      CliUx.ux.action.stop(chalk.bold.red('!'));
    } catch {}

    throw err;
  }

  /**
   * Checks to see if lando is running with sudo. If it is it
   * will exit the process with a stern warning
   *
   * @since 3.0.0
   * @alias lando.cli.checkPerms
   * @example
   * lando.cli.checkPerms()
   */
  checkPerms() {
    const sudoBlock = require('sudo-block');
    sudoBlock(this.makeArt('sudoRun'));
  };

  /*
   * Confirm question
   */
  confirm(message = 'Are you sure?') {
    return {
      describe: 'Auto answer yes to prompts',
      alias: ['y'],
      default: false,
      boolean: true,
      interactive: {
        type: 'confirm',
        default: false,
        message: message,
      },
    };
  };

  error(input, options) {
    return Errors.error(input, options);
  }

  exit(code = 0) {
    return Errors.exit(code);
  }

  exitError(input, options = {}, exitCode = 1) {
    // get error
    Errors.error(input, {...options, exit: false});
    // get code
    exitCode = (options && options.exit) ? options.exit : exitCode;
    // exit
    process.exit(exitCode);
  }

  async finally(Error) {
    try {
      const config = Errors.config;
      if (config.errorLogger) await config.errorLogger.flush();
    } catch (error) {
      console.error(error);
    }
  }

  /*
   * Format data
   */
  formatData(data, {path = '', format = 'default', filter = []} = {}, opts = {}) {
    return formatters.formatData(data, {path, format, filter}, opts);
  };

  /*
   * FormatOptios
   */
  formatOptions(omit = []) {
    return formatters.formatOptions(omit);
  };

  getHelp(tasks, args, cid = this.cid) {
    // if we have something cached then just return that
    if (this.#_cache.has([cid, 'help'])) return this.#_cache.get([cid, 'help']);

    // if we get here then we need to do task discovery
    this.debug('running %o help discovery...', 'cli');
    // get help
    const help = tasks.map(task => {
      // we try catch here because we dont want a busted task to break the whole thing
      try {
        return {...require(task.file)(...args), file: task.file};
      } catch (error) {
        // @NOTE: what is the best log level for this? warning?
        this.warn(`Had problems loading task '${task.name}' from ${task.file}!`);
        this.debug('could not load task %o from %o with error %O', task.name, task.file, error);
      }
    })
    // this makes sure any "caught" tasks dont get added as undefined elements
    .filter(Boolean);
    // set and return
    this.#_cache.set([cid, 'help'], help);
    return help;
  }

  getHooks(ctx, cid = this.cid) {
    // if we have something cached then just return that
    if (this.#_cache.has([cid, 'hooks'])) return this.#_cache.get([cid, 'hooks']);

    // if we get here then we need to do task discovery
    this.debug('running %o hooks discovery...', 'cli');
    // get the hooks
    const hooks = require('@lando/core-next/utils/get-manifest-array')('hooks', ctx).map(group => ({...group, hooks: group.data.cli}));
    // set and return
    this.#_cache.set([cid, 'hooks'], hooks);
    return hooks;
  }

  getTasks(ctx, cid = this.cid) {
    // if we have something cached then just return that
    if (this.#_cache.has([cid, 'tasks'])) return this.#_cache.get([cid, 'tasks']);

    // if we get here then we need to do task discovery
    this.debug('running %o task discovery...', 'cli');
    // get the list
    const tasks = Object.entries(require('@lando/core-next/utils/get-manifest-object')('tasks', ctx))
      .map(([name, file]) => ({name, file}))
      .filter(task => fs.existsSync(`${task.file}.js`) || fs.existsSync(task.file));

    // set and return
    this.#_cache.set([cid, 'tasks'], tasks);
    return tasks;
  }

  log(message = '', ...args) {
    message = typeof message === 'string' ? message : inspect(message);
    process.stdout.write(format(message, ...args) + '\n');
  }

  logToStderr(message = '', ...args) {
    message = typeof message === 'string' ? message : inspect(message);
    process.stderr.write(format(message, ...args) + '\n');
  }

  /**
   * Returns some cli "art"
   *
   * @since 3.0.0
   * @alias lando.cli.makeArt
   * @param {String} [func='start'] The art func you want to call
   * @param {Object} [opts] Func options
   * @return {String} Usually a printable string
   * @example
   * console.log(lando.cli.makeArt('secretToggle', true);
   */
  makeArt(func, opts) {
    return require('./art')[func](opts);
  };

  /*
   * Parses a lando task object into something that can be used by the [yargs](http://yargs.js.org/docs/) CLI.
   *
   * A lando task object is an abstraction on top of yargs that also contains some
   * metadata about how to interactively ask questions on both a CLI and GUI.
   *
   * @since 3.5.0
   * @alias lando.cli.parseToYargs
   * @see [yargs docs](http://yargs.js.org/docs/)
   * @see [inquirer docs](https://github.com/sboudrias/Inquirer.js)
   * @param {Object} task A Lando task object (@see add for definition)
   * @param {Object} [config={}] The landofile
   * @return {Object} A yargs command object
   * @example
   * // Add a task to the yargs CLI
   * yargs.command(lando.tasks.parseToYargs(task));
   */
  async parseToYargs(task) {
    const handler = async argv => {
      // if run is not a function then we need to get it
      if (task.run instanceof Function === false) task.run = require(task.file)(this).run;
      // immediately build some arg data set opts and interactive options
      const data = {options: argv, inquiry: formatters.getInteractive(task.options, argv)};
      // run our pre command hook
      await this.runHook('prerun', {id: argv._[0], data, cli: this, task});

      // queue up an extended debugger
      const debug = this.debug.extend(`task:${task.command}`);
      debug('start task %o', task.file);

      // run the command here
      let err;
      let result;
      try {
        debug('start task %o with %o', task.command, data);
        result = await task.run(data.options, {
          app: this.app,
          context: this.context,
          ctx: this.ctx,
          debug,
          [this.id]: this.product,
          product: this.product,
        });
      } catch (error) {
        err = error;
        await this.catch(error);
      } finally {
        await this.finally(err);
        debug('done task %o', task.command);
      }

      // run postrun hook
      // as per the OCLIF docs this ONLY runs if the command succeeds
      await this.runHook('postrun', {id: argv._[0], result, cli: this});

      // Return result
      return result;
    };

    // Return our yarg command
    return {
      command: task.command,
      describe: task.describe,
      builder: formatters.sortOptions(task.options),
      handler,
    };
  };

  prettify(data, {arraySeparator = ', '} = {}) {
    return require('./prettify')(data, {arraySeparator});
  };

  /*
   * Run the CLI
   */
  async run(argv = process.argv.slice(2), options = {}) {
    this.debug('starting cli with argv %o and options %o', argv, options);
    // add some color
    const yargonaut = require('yargonaut');
    yargonaut.style('green').errorsStyle('red');

    // get the status of some global flags
    const {flags} = await Parser.parse(argv, {strict: false, flags: gflags.oclif});

    // debug if flag config file doesnt exist
    // @NOTE: should this be a proper error?
    if (flags.config && !fs.existsSync(flags.config)) {
      this.debug('tried to load %s into config but it doesnt exist', flags.config);
    }

    // handle legacy and now hidden flags for backwards compatibilities sake
    if (flags.channel || flags.experimental || flags['secret-toggle']) {
      this.error('--channel, --experimental and --secret-toggle are no longer valid flags');
    }

    // get the system (oclif) config and normalize our argv
    const config = await Config.load(Object.keys(options).length === 0 ? __dirname : options);
    let [id, ...argvSlice] = normalizeArgv(config, argv);

    // debug
    this.debug('system config loaded %O', config);
    this.debug('running command %o with args %o', id, argvSlice);

    // Concat OCLIF hooks from config, transform to absolute paths
    // @NOTE: should we just concat the whole plugin?
    // @NOTE: we do this here instead of passing in during instantiation in bin/lando.js because Config.load is async
    // and we want to use that so we can accomodate any "oclif" plugins that add hooks
    this.hooks = this.hooks.concat(config.plugins.map(plugin => ({
      id: plugin.name,
      hooks: plugin.hooks || [],
      name: plugin.name,
      root: plugin.root,
    })));

    // minstrap hook
    //
    // @NOTE: the minstrapper is a lightweight thing that loads the main bootstrapper which is what creates the
    // "product" object, which is called "lando" by default. the hook itelf exists primarily so that the bootstrapper
    // can be modified at a very core level. this is useful if you want to distribute your own lando with a different
    // name, config set, and different "pre command" runtime eg "whitelabeling"
    //
    // because this event runs BEFORE lando is ready you cannot access it through a lando plugin. instead you need to use
    // an OCLIF hook.
    // See: https://oclif.io/docs/hooks.
    //
    // FWIW if you are interested in modifying things at this level you should probably just get in touch with us
    // see: https://lando.dev/support
    const minstrapper = require('./../config/minstrap')({argv, cache: this.cache, config, configFile: flags.config, id: this.id});
    await this.runHook('minstrap', {minstrapper});
    this.debug('going to use %o as product', minstrapper.bootstrapper);

    // use the minstrapper 2 get da product/lando
    // we call it "Product" here instead of "Lando" because at this point we want to keep it generic
    // once we are "downstream" we use Lando/lando as a convention even if the product id is not lando
    const Product = require(minstrapper.product);
    // override some default static properties
    Product.debug = this.debug.contract(-1).extend(this.id);
    // instantiate
    this.product = new Product(minstrapper.config);

    // Run the product bootstrap
    // @TODO: still not 100% on what this _should_ be for? could define some product events i guess?
    // maybe recipe toggling or something:
    // @TODO: would be great to have a hook or other mechanism here so that
    // we can replace core.app with like PantheonApp or some such?

    // @TODO: some sort of appstrap event and maybe some other events?
    // @TODO: separate out CLI specific stuff?
    // @TODO: bootstrap should not be CLI specific
    // remove minstrapper.app?

    // @TODO: purpose of bootstrap
    // 1. events?
    // 2. some sort of app selection? i guess that is also just in the config?
    // 3. separate out CLI and non-CLI stuff?

    try {
      await this.product.bootstrap(config);
      this.debug('product %o bootstrap completed successfully', this.product.id);
    } catch (error) {
      console.error('Bootstrap failed!'); // eslint-disable-line no-console
      this.exitError(error);
    }

    // determine if we have an app or not
    const landofile = this.product.config.get('core.landofile');
    const landofiles = [`${landofile}.yaml`, `${landofile}.yml`];
    const landofilePath = this.product.findApp(landofiles, process.cwd());

    // if we have an file then lets set some things in the config for downstream purposes
    if (fs.existsSync(landofilePath)) {
      // Also get our app object
      const App = this.product.getComponent('core.app');
      // override some default static properties
      App.debug = this.debug.contract(-1).extend(App.name);
      this.app = new App({landofile: landofilePath, config: this.product.config, plugins: this.product.getPlugins()});
      this.debug('discovered an app called %o at %o', this.app.name, path.dirname(landofilePath));

      // keep this around for backwards compat
      this.minapp = this.app;
    }

    // determine some context stuff
    this.context = {app: this.app !== undefined, global: this.app === undefined};
    this.ctx = this.context.app ? this.app : this.product;
    this.cid = this.context.app ? this.app.id : this.product.id;
    this.debug('command is running with context %o and cid %o', this.context, this.cid);

    // get additinal hooks from the context
    this.hooks = this.hooks.concat(this.getHooks(this.ctx));
    // get tasks
    this.tasks = this.getTasks(this.ctx);
    // get help https://www.youtube.com/watch?v=CpZakOJlRoY&t=30s
    this.help = this.getHelp(this.tasks, [this]);

    // init hook
    await this.runHook('init', {id, argv: argvSlice, cli: this, config});

    // Initialize
    const suffix = this.app ? `(${this.app.name}, v4)` : '(v4)';
    const cmd = !this.product.config.get('system.packaged') ? '$0' : path.basename(get(process, 'execPath', 'lando'));
    const usage = [`Usage: ${cmd} <command> [args] [options] | ${chalk.magenta(suffix)}`];

    // Yargs!
    yargs.usage(usage.join(' '))
      .example(`${this.id} start`, 'starts up the app in cwd')
      .example(`${this.id} rebuild --help`, 'displays help about the rebuild command')
      .example(`${this.id} destroy -y --debug`, 'runs destroy non-interactively and with debug output')
      .example(`${this.id} --no-cache`, 'disables and wipes cache')
      .recommendCommands()
      .showHelpOnFail(false)
      .wrap(yargs.terminalWidth() * 0.70)
      .option('channel', globalOptions.channel)
      .option('clear', globalOptions.clear)
      .option('debug', globalOptions.debug)
      .option('experimental', globalOptions.experimental)
      .option('no-cache', globalOptions['no-cache'])
      .help(false)
      .option('lando', globalOptions.lando)
      .option('help', globalOptions.help)
      .option('verbose', globalOptions.verbose)
      .group('clear', chalk.green('Global Options:'))
      .group('debug', chalk.green('Global Options:'))
      .group('help', chalk.green('Global Options:'))
      .group('no-cache', chalk.green('Global Options:'))
      .version(false);

    // loop through the tasks and add them to the CLI
    for (const task of sortBy(this.help, 'command')) {
      if (task.handler) yargs.command(task);
      else yargs.command(await this.parseToYargs(task));
    }

    // try to get the current tasks
    const current = this.help.find(task => task.command === id);

    // if we cannot get teh current tasks then show help
    if (!current) {
      yargs.showHelp();
      this.log();
    }

    // Show help unless this is a delegation command
    if ((yargs.argv.help || yargs.argv.lando) && get(current, 'delegate', false) === false) {
      yargs.showHelp('log');
      this.log();
      process.exit(0);
    }

    // YARGZ MATEY
    yargs.argv;
  };

  reinit(cid = this.cid) {
    this.#_cache.remove([cid, 'hooks']);
    this.#_cache.remove([cid, 'tasks']);
    this.#_cache.remove([cid, 'help']);
  };

  async runHook(event, data) {
    return require('@lando/core-next/utils/run-hook')(event, data, this.hooks, {cli: this}, this.debug, this.exitError);
  };

  warn(input) {
    Errors.warn(input);
    return input;
  };
};
