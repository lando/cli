'use strict';

// Modules
const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');

const formatters = require('./formatters');
const getSysDataPath = require('../utils/get-system-data-dir');

// Global options
const globalOptions = {
  channel: {
    describe: 'Sets the update channel',
    choices: ['edge', 'none', 'stable'],
    global: true,
    type: 'array',
  },
  clear: {
    describe: 'Clears the lando tasks cache',
    global: true,
    type: 'boolean',
  },
  debug: {
    describe: 'Shows debug output',
    global: true,
    type: 'boolean',
  },
  experimental: {
    describe: 'Activates experimental features',
    global: true,
    hidden: true,
    type: 'boolean',
  },
  help: {
    describe: 'Shows lando or delegated command help if applicable',
    type: 'boolean',
  },
  lando: {
    hidden: true,
    type: 'boolean',
  },
  verbose: {
    alias: 'v',
    describe: 'Runs with extra verbosity',
    type: 'count',
  },
};

/*
 * Construct the CLI
 */
module.exports = class Cli {
  constructor(
    prefix = 'LANDO',
    logLevel = 'warn',
    userConfRoot = path.join(os.homedir(), '.lando'),
    coreBase = '@lando/core',
    debug = require('@lando/core-next/debug')('@lando/cli'),
  ) {
    this.prefix = prefix;
    this.logLevel = logLevel;
    this.userConfRoot = userConfRoot;
    this.coreBase = coreBase;
    this.debug = debug;
    this.chalk = require('chalk');
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
   * Toggle the secret toggle
   */
  clearTaskCaches() {
    if (fs.existsSync(process.landoTaskCacheFile)) fs.unlinkSync(process.landoTaskCacheFile);
    if (fs.existsSync(process.landoAppTaskCacheFile)) fs.unlinkSync(process.landoAppTaskCacheFile);
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

  /**
   * Returns a config object with some good default settings for bootstrapping
   * lando as a command line interface
   *
   * @since 3.5.0
   * @alias lando.cli.defaultConfig
   * @param {Object} [appConfig={}] Optional raw landofile
   * @return {Object} Config that can be used in a Lando CLI bootstrap
   * @example
   * const config = lando.cli.defaultConfig();
   * // Kick off our bootstrap
   * bootstrap(config).then(lando => console.log(lando));
   */
  defaultConfig(appConfig = {}) {
    // determin some things about the cli
    // absolute path to cli base
    const srcRoot = path.resolve(__dirname, '..');
    const pjson = require(path.join(srcRoot, 'package.json'));

    // whether the cli is "packaged" eg a self-contained binary or not
    const packaged = _.has(process, 'pkg');
    // cli is packaged and also is a "dev" release
    const dev = packaged
      && pjson.version.split('-').length === 3
      && pjson.version.split('-')[1] !== 0;

    // when packaged this resolves symlinks and gives you the actual absolute path of the binary
    // when run from source it gives you the path to js entrypoint
    const entrypoint = packaged ? path.resolve(process.argv0) ?? get(process, 'env._') : process.argv[1] ?? get(process, 'env._');
    const file = packaged ? process.execPath : _.get(process, 'mainModule.filename', process.argv[1]);

    // this is just the default place to install the lando binaries
    const installPath = path.join(this.userConfRoot, 'bin');

    // if the cli is running from source (eg a git repo) or not
    const source = fs.existsSync(path.join(srcRoot, '.git', 'HEAD'));
    const commit = source ? require('../utils/get-commit-hash')(srcRoot, {short: true}) : false;
    const coreBase = this.coreBase === '@lando/core';

    // put it all together
    const cli = {commit, coreBase, dev, entrypoint, file, installPath, packaged, plugin: srcRoot, source};

    const config = {
      alliance: fs.existsSync(path.join(this.userConfRoot, 'secret-toggle')),
      channel: 'stable',
      cli,
      configSources: [path.join(srcRoot, 'config.yml'), path.join(this.userConfRoot, 'config.yml')],
      command: this.argv(),
      domain: 'lndo.site',
      disablePlugins: ['lando-core', '@lando/core-next'],
      experimental: false,
      envPrefix: this.prefix,
      fatcore: fs.existsSync(path.resolve(__dirname, '..', 'FATCORE')),
      isInteractive: require('is-interactive')(),
      landoFile: '.lando.yml',
      landoFileConfig: appConfig,
      leia: _.has(process, 'env.LEIA_PARSER_RUNNING'),
      logLevelConsole: (this.argv().verbose) ? this.argv().verbose + 1 : this.logLevel,
      logDir: path.join(this.userConfRoot, 'logs'),
      mode: 'cli',
      packaged,
      pluginConfig: {},
      pluginConfigFile: path.join(this.userConfRoot, 'plugin-auth.json'),
      pluginDirs: [
        // src locations
        {path: srcRoot, subdir: 'plugins', namespace: '@lando'},
        {path: path.join(srcRoot, 'node_modules', '@lando'), subdir: '.', namespace: '@lando'},
        // system locations
        {path: path.join(getSysDataPath('lando'), 'plugins'), subdir: '.', type: 'system'},
        {path: path.join(getSysDataPath('lando'), 'plugins', '@lando'), subdir: '.', namespace: '@lando', type: 'system-lando'},
        // user locations
        {path: path.join(this.userConfRoot, 'global-plugins', '@lando'), subdir: '.', namespace: '@lando'},
        {path: this.userConfRoot, subdir: 'plugins', type: 'user'},
        {path: path.join(this.userConfRoot, 'plugins', '@lando'), subdir: '.', namespace: '@lando', type: 'user-lando'},
      ],
      preLandoFiles: ['.lando.base.yml', '.lando.dist.yml', '.lando.recipe.yml', '.lando.upstream.yml'],
      postLandoFiles: ['.lando.local.yml', '.lando.user.yml'],
      product: 'lando',
      runtime: 3,
      userConfRoot: this.userConfRoot,
    };

    // version calculations are actually kind of complex
    // lets start with the cli since that is easiest
    config.cli.version = pjson.version;
    // if the cli is running from source lets modify with the commit
    if (!cli.packaged && !cli.dev && cli.source && cli.commit) config.cli.version = `${config.cli.version}-0-${cli.commit}`;

    // for the core version, which is for all intents and purposes the "lando" version lets start with the corebase
    config.version = require(path.join(this.coreBase, 'package.json')).version;

    // if however the cli is a "dev" release and core is internal then lets use the version in the cli package.json
    // this is helpful if the dev release uses like a commit hash of core instead of a proper semver
    if (cli.dev && cli.coreBase) {
      const version = _.get(pjson, 'dependencies.@lando/core', config.version);
      const pkg = require(`${this.coreBase}/utils/parse-package-name`)(version);
      const devStep = cli.version.split('-')[1] || 0;
      if (pkg.type === 'git' && pkg.gitCommittish) {
        config.version = `${config.version}-${devStep}-${pkg.gitCommittish}`;
        config.cli.coreBaseVersion = config.version;
      }

    // if corebase is not internal then we need to check if its running from source or not
    } else if (!cli.coreBase && require('../utils/get-commit-hash')(this.coreBase)) {
      const commit = require('../utils/get-commit-hash')(this.coreBase, {short: true});
      config.version = `${config.version}-0-${commit}`;
    }

    // useragent
    config.userAgent = `Lando/${config.version}`;
    // return
    return config;
  }

  /*
   * Format data
   */
  formatData(data, {path = '', format = 'default', filter = []} = {}, opts = {}) {
    return formatters.formatData(data, {path, format, filter}, opts);
  }

  /*
   * FormatOptios
   */
  formatOptions(omit = []) {
    return formatters.formatOptions(omit);
  }

  getInquirer() {
    return require('inquirer');
  }

  getUX() {
    return require('@oclif/core').ux;
  }

  isDebug() {
    const {debug, verbose} = this.argv();
    return debug ? 1 + verbose : 0 + verbose;
  }

  /**
   * Cli wrapper for error handler
   *
   * @since 3.0.0
   * @alias lando.cli.handleError
   * @param {Error} error The error
   * @param {Function} handler The error handler function
   * @param {Integer} verbose [verbose=this.argv().verbose] The verbosity level
   * @param {Object} lando The Lando object
   * @return {Integer} The exit codes
   */
  handleError(error, handler, verbose = this.argv(), lando = {}) {
    // Set the verbosity
    error.verbose = verbose;
    // Ask question if we haven't sent error reporting yet
    return lando.Promise.try(() => {
      if (_.isNil(lando.cache.get('report_errors'))) {
        const inquirer = require('inquirer');
        console.error(this.makeArt('crash'));
        const test = {
          name: 'reportErrors',
          type: 'confirm',
          default: true,
          message: 'Send crash reports?',
        };
        return inquirer.prompt([test]).then(answers => {
          lando.cache.set('report_errors', answers.reportErrors, {persist: true});
        });
      }
    })
    // Report error if user has error reporting on
    .then(() => handler.handle(error, lando.cache.get('report_errors')).then(code => process.exit(code)));
  }

  /*
   * Init
   */
  init(yargs, tasks, config, userConfig) {
    // @TODO: what if we are running from symlink?

    // basic usage
    const usage = ['Usage: $0 <command> [args] [options]'];
    // add experimental mode info
    if (userConfig.experimental) usage.push(`${this.makeArt('print', {text: '(experimental mode)', color: 'magenta'})}`);

    // Yargs!
    yargs.usage(usage.join(' '))
      .demandCommand(1, 'You need at least one command before moving on')
      .example('$0 start', 'Run lando start')
      .example('$0 rebuild --help', 'Get help about using the lando rebuild command')
      .example('$0 destroy -y --debug', 'Run lando destroy non-interactively and with maximum verbosity')
      .example('$0 --clear', 'Clear the lando tasks cache')
      .middleware([(argv => {
        argv._app = config;
      })])
      .recommendCommands()
      .wrap(yargs.terminalWidth() * 0.70)
      .option('channel', globalOptions.channel)
      .option('clear', globalOptions.clear)
      .option('debug', globalOptions.debug)
      .option('experimental', globalOptions.experimental)
      .help(false)
      .option('lando', globalOptions.lando)
      .option('help', globalOptions.help)
      .option('verbose', globalOptions.verbose)
      .version(false);

    // Loop through the tasks and add them to the CLI
    _.forEach(_.sortBy(tasks, 'command'), task => {
      if (_.has(task, 'handler')) yargs.command(task);
      else yargs.command(this.parseToYargs(task, config));
    });

    // Modify the script name in certain circumstances eg its packaged and being invoked from a symlink
    // @NOTE: should we check for argv0 being a symlink?
    if (_.has(process, 'pkg') && path.join(process.cwd(), process.argv0) !== process.execPath) {
      yargs.scriptName(path.basename(process.argv0));
    }

    // Show help unless this is a delegation command
    const current = _.find(tasks, {command: yargs.argv._[0]});
    if ((yargs.argv.help || yargs.argv.lando) && _.get(current, 'delegate', false) === false) {
      yargs.showHelp('log');
      process.exit(0);
    }

    // YARGZ MATEY
    yargs.argv;
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

  /**
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
  parseToYargs({command, describe, options = {}, run = {}, level = 'app'}, config = {}) {
    const handler = argv => {
      // Immediately build some arg data set opts and interactive options
      const data = {options: argv, inquiry: formatters.getInteractive(options, argv)};
      // Remove legacy secret toggle if still there
      const secretToggleFile = path.join(this.defaultConfig().userConfRoot, 'secret-toggle');
      if (fs.existsSync(secretToggleFile)) fs.unlinkSync(secretToggleFile);

      // Summon lando
      const Lando = require(this.coreBase);
      const lando = new Lando(this.defaultConfig(config));

      // Add this to lando
      lando.cli = this;

      // Handle uncaught things
      _.forEach(['unhandledRejection', 'uncaughtException'], exception => {
        process.on(exception, error => this.handleError(error, lando.error, this.isDebug(), lando));
      });

      // run the bootstrap
      return lando.bootstrap(level)
        /**
         * Event that allows altering of argv or inquirer before interactive prompts
         * are run
         *
         * You will want to replace CMD with the actual task name eg `task-start-answers`.
         *
         * @since 3.0.0
         * @event task_CMD_answers
         * @property {Object} answers argv and inquirer questions
         */
        .then(() => lando.events.emit('cli-answers', data, argv._[0]))
        .then(() => lando.events.emit(`cli-${argv._[0]}-answers`, data, argv._[0]))

        // Attempt to filter out questions that have already been answered
        // Prompt the use for feedback if needed and sort by weight
        .then(() => formatters.handleInteractive(data.inquiry, data.options, command, lando))

        /**
         * Event that allows final altering of answers before the task runs
         *
         * You will want to replace CMD with the actual task name eg `task-start-run`.
         *
         * @since 3.0.0
         * @event task_CMD_run
         * @property {Object} answers object
         */
        .then(answers => lando.events.emit('cli-run', _.merge(data.options, answers), argv._[0]))
        .then(() => lando.events.emit(`cli-${argv._[0]}-run`, data, argv._[0]))

        // Find and run the task, unless we already have one
        // @TODO: somehow handle when commands break eg change task name, malformed tasks
        .then(() => {
          if (_.isFunction(run)) return run(data.options, lando);
          else return _.find(lando.tasks, {command}).run(data.options);
        })

        // Add a final event for other stuff
        .then(() => lando.events.emit('before-end'))

        // Handle all other errors eg likely things that happen pre bootstrap
        .catch(error => this.handleError(error, lando.error, this.isDebug(), lando))
        // If we caught an error that resulted in an error code lets make sure we exit non0
        .finally(() => process.exit(_.get(lando, 'exitCode', 0)));
    };

    // Return our yarg command
    return {command, describe, builder: formatters.sortOptions(options), handler};
  }

  prettify(data, {arraySeparator = ', '} = {}) {
    return require('../utils/prettify')(data, {arraySeparator});
  }

  /*
   * Run the CLI
   */
  run(tasks = [], config = {}) {
    const yargonaut = require('yargonaut');
    yargonaut.style('green').errorsStyle('red');
    const yargs = require('yargs');
    const {clear, channel, experimental, secretToggle} = yargs.argv;

    // Handle global flag error conditions first
    if (secretToggle && this.defaultConfig().packaged) {
      console.error(this.makeArt('secretToggleDenied'));
      process.exit(1);
    }
    if (channel && !_.includes(globalOptions.channel.choices, channel)) {
      console.error(this.makeArt('print', {text: `Unknown release channel: ${channel}`, color: 'red'}));
      process.exit(1);
    }

    // Handle all our configuration global opts first
    const userConfig = this.updateUserConfig();
    if (clear) console.log('Lando has cleared the tasks cache!');
    if (channel) {
      this.updateUserConfig({channel: channel});
      const updateFile = path.join(this.defaultConfig().userConfRoot, 'cache', 'updates');
      if (fs.existsSync(updateFile)) fs.unlinkSync(updateFile);
      console.log(this.makeArt('releaseChannel', channel));
    }
    if (experimental) {
      this.updateUserConfig({experimental: !userConfig.experimental});
      console.log(this.makeArt('experimental', !userConfig.experimental));
    }
    if (secretToggle) {
      this.updateUserConfig({alliance: !userConfig.alliance});
      console.log(this.makeArt('secretToggle', !userConfig.alliance));
    }
    if (clear || channel || experimental || secretToggle) {
      this.clearTaskCaches();
      process.exit(0);
    }

    // Initialize
    this.init(yargs, tasks, config, userConfig);
  }

  /*
   * Toggle a toggle
   */
  updateUserConfig(data = {}) {
    const Yaml = require(`${this.coreBase}/lib/yaml`);
    const yaml = new Yaml();
    const configFile = path.join(this.defaultConfig().userConfRoot, 'config.yml');
    const config = (fs.existsSync(configFile)) ? yaml.load(configFile) : {};
    const file = yaml.dump(configFile, _.assign({}, config, data));
    return yaml.load(file);
  }
};
