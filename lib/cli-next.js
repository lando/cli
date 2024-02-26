'use strict';

// modules
const chalk = require('chalk');
const fs = require('fs');
const gflags = require('./../config/flags');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

// OCLIF pieces we need
const {format, inspect} = require('util');
const {normalizeArgv} = require('@oclif/core/lib/help');
const {parse} = require('@oclif/parser');
const {ux, Errors} = require('@oclif/core');

const OConfig = require('@oclif/core').Config;

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
    hooks = {},
  } = {}) {
    // props
    this.cache = cache;
    this.debug = debug;
    this.hooks = hooks;
    this.id = id || path.basename(process.argv[1]) || 'lando';
    this.cid = this.id || cid;

    // select correct storage backend and setup cache
    this.StorageBackend = this.cache ? require('@lando/core-next/file-storage') : require('@lando/core-next/no-storage');
    this.#_cache = new this.StorageBackend(({debug: debug.extend('#cache'), dir: cacheDir}));
    // if cache is disabled and cachedir exist then flush it
    if (!this.cache && fs.existsSync(cacheDir)) this.StorageBackend.flush(cacheDir, debug.extend('#flush'));

    // add the CLIUX module from OCLIF
    this.ux = ux;

    // some debugging about what happened
    this.debug('instantiated cli with cache %o and hooks %o', this.cache, require('@lando/core-next/utils/get-object-sizes')(this.hooks));
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
  }

  async catch(err) {
    process.exitCode = process.exitCode ?? err.exitCode ?? 1;
    if (!err.message) throw err;
    try {
      this.ux.action.stop(chalk.bold.red('!'));
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
  }

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
  }

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
    return require('./formatters').formatData(data, {path, format, filter}, opts);
  }

  /*
   * FormatOptios
   */
  formatOptions(omit = []) {
    return require('./formatters').formatOptions(omit);
  }

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
    .filter(Boolean)
    // and then lets sort it alphabetically by command
    .sort((a, b) => {
      if (a.command < b.command) return -1;
      if (a.command > b.command) return 1;
      return 0;
    });

    // set and return
    this.#_cache.set([cid, 'help'], help);
    return help;
  }

  getHooks(ctx) {
    return ctx.manifest.getUncoded('hooks.cli', {ams: 'aoa'});
  }

  getTasks(ctx, cid = this.cid) {
    // if we have something cached then just return that
    if (this.#_cache.has([cid, 'tasks'])) return this.#_cache.get([cid, 'tasks']);

    // if we get here then we need to do task discovery
    this.debug('running %o task discovery...', 'cli');
    // get the list
    const tasks = Object.entries(ctx.manifest.get('tasks'))
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
  }

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
      const data = {options: argv, inquiry: require('./formatters').getInteractive(task.options, argv)};

      // run our pre command hook
      // @TODO: add command names and such?
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
      builder: require('./formatters').sortOptions(task.options),
      handler,
    };
  }

  prettify(data, {arraySeparator = ', '} = {}) {
    return require('../utils/prettify')(data, {arraySeparator});
  }

  /*
   * Run the CLI
   */
  async run(argv = process.argv.slice(2), options = {}) {
    this.debug('running cli with argv %o and options %o', argv, options);
    // add some color
    const yargonaut = require('yargonaut');
    yargonaut.style('green').errorsStyle('red');

    // NOTE: newer versinos of oclif changed "strict" as a parser option so we use the older one, this is probably
    // ok since we only use it here?
    const {flags} = await parse(argv, {strict: false, flags: gflags.oclif});

    // debug if flag config file doesnt exist
    // @NOTE: should this be a proper error?
    // @NOTE: should we try to get an absolute path?
    if (flags.config && !fs.existsSync(flags.config)) {
      this.debug('tried to load %o into config but it doesnt exist', flags.config);
    }

    // handle legacy and now hidden flags for backwards compatibilities sake
    if (flags.channel || flags.experimental || flags['secret-toggle']) {
      this.error('--channel, --experimental and --secret-toggle are no longer valid flags');
    }

    // get the system (oclif) config
    const oclif = await OConfig.load(Object.keys(options).length === 0 ? __dirname : options);
    // normalize our argv
    const [id, ...argvSlice] = normalizeArgv(oclif, argv);
    // add some extra stuff to the config
    oclif.argv = argv;
    oclif.cache = this.cache;
    oclif.configFile = flags.config;
    oclif.env = this.id.toUpperCase(),
    oclif.id = this.id;
    oclif.logger = this.debug;

    // debug
    this.debug('oclif config loaded %O', oclif);
    this.debug('running command %o with args %o', id, argvSlice);

    // start by getting our product config, we do this BEFORE getting the product because the product location
    // could potentially differ based on the config eg if the user changes config.system.data-dir;
    // @NOTE: do we want to allow oclif or config to be modifiable via hook this early? or is the minstrapper hook
    // sufficient?

    const config = require('../config/product')(oclif);
    const product = config.get('system.product-path');
    const minstrapper = {config, product};

    // Concat OCLIF hooks from config if applicable, transform to absolute paths
    // @NOTE: we do this here instead of passing in during instantiation in bin/lando because Config.load is async
    // and we want to use that so we can accomodate any "oclif" plugins that add hooks'
    const ohooks = oclif.getPluginsList()
      .map(plugin => require('@lando/core-next/utils/normalize-manifest-paths')({hooks: plugin.hooks}, plugin.root))
      .map(plugin => plugin.hooks)
      .filter(hooks => Object.keys(hooks).length > 0);
    if (ohooks.length > 0) this.hooks = config.merge(this.hooks, ohooks, ['aoa']);
    this.debug('found early run oclif hooks %o', require('@lando/core-next/utils/get-object-sizes')(this.hooks));

    // minstrap hook
    //
    // because this event runs BEFORE lando is ready you cannot access it through a lando plugin. instead you need to use
    // an OCLIF hook.
    // See: https://oclif.io/docs/hooks.
    //
    // FWIW if you are interested in modifying things at this level you should probably just get in touch with us
    // see: https://lando.dev/support
    await this.runHook('minstrap', {minstrapper});
    this.debug('going to use %o as product', minstrapper.product);

    // use the minstrapper 2 get da product/lando
    // we call it "Product" here instead of "Lando" because at this point we want to keep it generic
    // once we are "downstream" we use Lando/lando as a convention even if the product id is not lando
    const Product = require(minstrapper.product);
    // renamespace some debuggerrs
    Product.debug = this.debug.contract(-1).extend(this.id);
    minstrapper.config.debug = Product.debug.extend('config');

    // instantiate
    // @NOTE: we pass in Config, Backend etc because its saves us a good .3s which is a lot in a CLI boot
    this.product = new Product(minstrapper.config, {StorageBackend: this.StorageBackend});
    this[this.id] = this.product;

    // Run the product bootstrap
    try {
      await this.product.bootstrap(this);
      this.debug('product %o bootstrap completed successfully', this.product.id);
    } catch (error) {
      console.error('Bootstrap failed!'); // eslint-disable-line no-console
      this.exitError(error);
    }

    // determine if we have an app or not
    // @TODO: findApp is pretty CLI specific? shoudl we have getUtil for this?
    const appfile = this.product.config.get('core.appfile');
    const appfiles = [`${appfile}.yaml`, `${appfile}.yml`];
    const appfilePath = this.product.findApp(appfiles, process.cwd());

    // if we have an file then lets set some things in the config for downstream purposes
    if (fs.existsSync(appfilePath)) {
      // Also get our app object
      const App = this.product.getComponent('core.app');
      this.debug('discovered a %o app at %o', App.name, path.dirname(appfilePath));

      // override some default static properties
      App.debug = this.debug.contract(-1);
      this.app = new App({
        appfile: appfilePath,
        config: this.product.config,
        plugins: this.product.plugins,
        StorageBackend: this.StorageBackend,
      });
    }

    // determine some context stuff
    this.context = {app: this.app !== undefined, global: this.app === undefined};
    this.ctx = this.context.app ? this.app : this.product;
    this.cid = this.context.app ? this.app.id : this.product.id;
    this.debug('command is running with context %o and cid %o', this.context, this.cid);

    // merge in additinal hooks from the context
    config.merge(this.hooks, [this.getHooks(this.ctx)], ['concat']);
    this.debug('found %o hooks %o', 'cli', require('@lando/core-next/utils/get-object-sizes')(this.hooks));
    // get tasks
    this.tasks = this.getTasks(this.ctx);
    // get help https://www.youtube.com/watch?v=CpZakOJlRoY&t=30s
    this.help = this.getHelp(this.tasks, [this]);

    // init hook
    await this.runHook('init', {id, argv: argvSlice});

    // Initialize
    const suffix = this.app ? `(${this.app.name}, v4)` : '(v4)';
    const cmd = !this.product.config.get('system.packaged') ? '$0' : path.basename(process.execPath) || 'lando';
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
    for (const task of this.help) {
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
    if ((yargs.argv.help || yargs.argv.lando) && current.delegate !== true) {
      yargs.showHelp('log');
      this.log();
      process.exit(0);
    }

    // YARGZ MATEY
    yargs.argv;
  }

  reinit(cid = this.cid) {
    this.#_cache.remove([cid, 'tasks']);
    this.#_cache.remove([cid, 'help']);
  }

  async runHook(event, data) {
    return require('@lando/core-next/utils/run-hook')(event, data, this.hooks, {cli: this}, this.debug, this.exitError);
  }

  warn(input) {
    Errors.warn(input);
    return input;
  }
};
