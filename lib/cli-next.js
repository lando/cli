'use strict';

// Modules
const chalk = require('chalk');
const debug = require('debug')('lando:@lando/cli');
const formatters = require('./formatters');
const fs = require('fs');
const get = require('lodash/get');
const os = require('os');
const path = require('path');
const sortBy = require('lodash/sortBy');
const yargs = require('yargs');

const FileStorage = require('./file-storage');

// oclif pieces we need
const {format, inspect} = require('util');
const {normalizeArgv} = require('@oclif/core/lib/help');
const ModuleLoader = require('@oclif/core/lib/module-loader').default;
const {CliUx, Config, Errors} = require('@oclif/core');

// Global options
const globalOptions = {
  channel: {
    describe: 'set the update channel',
    choices: ['edge', 'none', 'stable'],
    global: true,
    hidden: true,
    type: 'array',
  },
  clear: {
    describe: 'clear registry and task caches',
    global: true,
    type: 'boolean',
  },
  debug: {
    describe: 'show debug output',
    global: true,
    type: 'boolean',
  },
  experimental: {
    global: true,
    hidden: true,
    type: 'boolean',
  },
  help: {
    describe: 'show lando or delegated command help if applicable',
    type: 'boolean',
  },
  lando: {
    hidden: true,
    type: 'boolean',
  },
  verbose: {
    alias: 'v',
    describe: 'run with extra verbosity',
    global: true,
    hidden: true,
    type: 'count',
  },
};

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
  #_cache

  constructor({cacheDir = os.tmpdir(), hooks = [], product = 'lando'} = {}) {
    // add private cache storage
    this.#_cache = new FileStorage(({debugspace: `${product}-cli`, dir: cacheDir}));
    // add the CLIUX module from OCLIF
    this.ux = CliUx;
    // hooks
    this.hooks = [];
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

  getTasks({id, noCache = false, registry = {}}, args) {
    // error if we have no id
    if (!id) throw Error('you need to specify a task-cache-id!');

    // if we have something cached then just return that
    if (!noCache && this.#_cache.get(id)) {
      const tasks = this.#_cache.get(id);
      debug('grabbed %o cli task(s) from task cache %o', tasks.list.length, id);
      return tasks;
    }

    // if we get here then we need to do task discovery
    debug('running %o task discovery...', id);

    // otherwise we need to calc and set it
    // but only if we have tasks to begin with
    if (registry.legacy && registry.legacy.tasks) {
      // get the list
      const list = Object.entries(registry.legacy.tasks)
        .map(([name, file]) => ({name, file}))
        .filter(task => fs.existsSync(`${task.file}.js`) || fs.existsSync(task.file));

      // get help https://www.youtube.com/watch?v=CpZakOJlRoY&t=30s
      const help = list.map(task => {
        // we try catch here because we dont want a busted task to break the whole thing
        try {
          return require(task.file)(...args);
        } catch (error) {
          // @NOTE: what is the best log level for this? warning?
          this.warn(`Had problems loading task '${task.name}' from ${task.file}!`);
          debug('could not load task %o from %o with error %O', task.name, task.file, error);
        }
      })
      // this makes sure any "caught" tasks dont get added as undefined elements
      .filter(Boolean);

      // set, debug and return
      this.#_cache.set(id, {list, help});
      debug('added %o tasks(s) to the %o task cache', list.length, id);
      return {list, help};
    }
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
  async parseToYargs({command, describe, options = {}, run}, config = {}) {
    const handler = async argv => {
      // Immediately build some arg data set opts and interactive options
      const data = {options: argv, inquiry: formatters.getInteractive(options, argv)};
      debug('command %o startings with handler options %o', command, data);

      // run our pre command hook
      await this.runHook('prerun', {data, id: argv._[0]});

      // if run is not a function then we need to set it
      if (run instanceof Function === false) {
        const {lando, tasks} = config;
        const task = tasks.list
          .filter(task => task.name === command)
          .map(task => require(task.file)(lando, this))
          .find(task => task.command === command);
        // @TODO: error handling, task has no run?
        run = task.run;
      }

      // run the command here
      let err;
      let result;
      try {
        const {cli, context, lando, minapp} = config;
        const debug = require('debug')(`lando:@lando/cli:command:${command}`);
        result = await run(data.options, {cli, context, debug, lando, minapp});
      } catch (error) {
        err = error;
        await this.catch(error);
      } finally {
        await this.finally(err);
      }

      // run postrun hook
      // as per the OCLIF docs this ONLY runs if the command succeeds
      await this.runHook('postrun', {id: argv._[0], result});

      // Return result
      return result;
    };

    // Return our yarg command
    return {command, describe, builder: formatters.sortOptions(options), handler};
  };

  prettify(data, {arraySeparator = ', '} = {}) {
    return require('./prettify')(data, {arraySeparator});
  };

  /*
   * Run the CLI
   */
  async run(argv = process.argv.slice(2), options = {}) {
    debug('starting %o with %o and %o', '@lando/cli:run', argv, options);

    // get the status of our global flags
    const {channel, clear, experimental, secretToggle} = this.argv();

    // handle legacy and now hidden flags for backwards compatibilities sake
    if (channel || experimental || secretToggle) {
      this.error('--channel, --experimental and --secret-toggle are no longer valid flags');
    }

    // add some color
    const yargonaut = require('yargonaut');
    yargonaut.style('green').errorsStyle('red');

    // get the system (oclif) config and normalize our argv
    this.config = await Config.load(Object.keys(options).length === 0 ? __dirname : options);
    let [id, ...argvSlice] = normalizeArgv(this.config, argv);

    // debug
    debug('system config loaded %O', this.config);
    debug('running command %o with args %o', id, argvSlice);

    // Concat OCLIF hooks from config, transform to absolute paths
    // @NOTE: should we just concat the whole plugin?
    this.hooks = this.hooks.concat(this.config.plugins.map(plugin => ({
      id: plugin.name,
      hooks: plugin.hooks || [],
      name: plugin.name,
      root: plugin.root,
    })));

    // init hook
    await this.runHook('init', {id, argv: argvSlice});

    // at this point we should have the app, lando and tasks
    const {lando, minapp, tasks} = this.config;

    // message about cache clearing if no command is run
    // @NOTE: the actual cache clearing is handled before this where appropriate eg noCache is set on lando/minapp/task builds
    if (clear && Array.isArray(tasks.help) && tasks.help.every(task => task.command !== id)) {
      this.logToStderr('Lando has cleared relevant cli caches');
      this.exit();
    }

    // Initialize
    const suffix = minapp ? `(${minapp.name}, v4)` : '(v4)';
    const cmd = !lando.config.get('system.packaged') ? '$0' : path.basename(get(process, 'execPath', 'lando'));
    const usage = [`Usage: ${cmd} <command> [args] [options] | ${chalk.magenta(suffix)}`];

    // Yargs!
    yargs.usage(usage.join(' '))
      .demandCommand(1, 'You need at least one command before moving on!')
      .example('lando start', 'starts up the app in cwd')
      .example('lando rebuild --help', 'displays help about the rebuild command')
      .example('lando destroy -y --debug', 'runs destroy non-interactively and with debug output')
      .example('lando --clear', 'clears task and registry caches')
      // @NOTE: we probably dont need this anymore but keeping for somewhat backwards compat
      .middleware([(argv => {
        argv._app = minapp;
      })])
      .recommendCommands()
      .showHelpOnFail(false)
      .wrap(yargs.terminalWidth() * 0.70)
      .option('channel', globalOptions.channel)
      .option('clear', globalOptions.clear)
      .option('debug', globalOptions.debug)
      .option('experimental', globalOptions.experimental)
      .help(false)
      .option('lando', globalOptions.lando)
      .option('help', globalOptions.help)
      .option('verbose', globalOptions.verbose)
      .group('clear', chalk.green('Global Options:'))
      .group('debug', chalk.green('Global Options:'))
      .group('help', chalk.green('Global Options:'))
      .version(false);

    // loop through the tasks and add them to the CLI
    for (const task of sortBy(tasks.help, 'command')) {
      if (task.handler) yargs.command(task);
      else yargs.command(await this.parseToYargs(task, this.config));
    }

    // try to get the current tasks
    const current = tasks.help.find(task => task.command === id);

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

  // @NOTE: this is heavily adapated from oclifs own runHook
  // @TODO: eventually use @lando/core-next/util/runHook
  //        this means we need to move context, hooks arrays and error handler into the signature of a generic
  // @TODO: add timeout back in?
  async runHook(event, data) {
    // just helpful message to indicate we have started a cli hook
    debug('start %s hook', event);
    // collect successes and failures
    const final = {successes: [], failures: []};

    // generate promises from this.hooks
    const promises = this.hooks.map(async group => {
      // @TODO: make this look better
      // @TODO: better descriptor than event? the oclif one uses the plugin name?
      // @NOTE: i dont think "this" works in async functions?
      const context = {...this, debug: require('debug')(['@lando/cli', group.name || group.id, 'hooks', event].join(':'))};
      // get all the runner for this group
      const runners = group.hooks[event] || [];
      // loop through runners and try to get results
      for (const runner of runners) {
        try {
          const {isESM, module, filePath} = await ModuleLoader.loadWithData(group, runner);
          debug('start', isESM ? '(import)' : '(require)', filePath);
          // try to get result
          // @TODO: eventually cli/config are specific to this implementation so they need to be
          // taken out and passed in when we move to the util
          const result = await module.call(context, {...data, cli: this, config: this.config, debug: context.debug});
          final.successes.push({group, result});
          debug('done');

        // put errors here?
        } catch (error) {
          final.failures.push({group, error});
          debug(error);
        }
      }
    });

    // FIRE EVERYTHING!!!
    await Promise.all(promises);
    // log
    debug('%s hook done', event);
    // if no failures then just return like config._runHook does
    if (final.failures.length === 0) return final;
    // handler errors
    // NOTE: this is also specific to the implmentation so a util version needs to be able to accept a handler?
    // SEE: see: https://github.com/oclif/core/issues/393
    this.exitError(final.failures[0].error);
  }

  warn(input) {
    Errors.warn(input);
    return input;
  };
};
