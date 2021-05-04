#!/usr/bin/env node

'use strict';

const _ = require('lodash');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const Log = require('./../lib/logger');
const log = new Log({logLevelConsole: 'debug', logName: 'pkg'});
const os = require('os');
const path = require('path');
const Promise = require('bluebird');
const Shell = require('./../lib/shell');
const shell = new Shell(log);
const util = require('./util');

// Start by splitting up args passed in via target
const pieces = _.get(argv, 'target', '').split('-');

// Split up into pieces but also be
const pkgNodeVersion = pieces[0] || `node${util.NODE_VERSION}`;
const pkgOs = pieces[1] || util.cliTargetOs();
const pkgArch = pieces[2] || os.arch();
// Assemble the target
const target = [pkgNodeVersion, pkgOs, pkgArch].join('-');

// Lando info
const version = require('./../package.json').version;
const pkgType = [pkgOs, pkgArch, 'v' + version].join('-');
const pkgExt = (pkgOs === 'win') ? '.exe' : '';
const cliPkgName = 'lando-' + pkgType + pkgExt;

// Files
const files = {
  dist: path.resolve('dist'),
  cli: {
    buildSrc: [
      path.resolve('bin'),
      path.resolve('experimental'),
      path.resolve('integrations'),
      path.resolve('lib'),
      path.resolve('plugins'),
      path.resolve('config.yml'),
      path.resolve('package.json'),
      path.resolve('yarn.lock'),
    ],
    build: path.resolve('build', 'cli'),
    dist: {
      src: path.resolve('build', 'cli', cliPkgName),
      dest: path.resolve('dist', 'cli', cliPkgName),
    },
  },
  installer: {
    buildSrc: [path.resolve('installer', process.platform)],
    build: path.resolve('build', 'installer'),
    dist: {
      src: path.resolve('build', 'installer', 'dist'),
      dest: path.resolve('dist'),
    },
  },
};

// Get things based on args
let cleanDirs = [files.cli.build];
let buildCopy = [{src: files.cli.buildSrc, dest: files.cli.build}];
let buildCmds = _.map(util.cliPkgTask(cliPkgName, target), cmd => (util.parseCommand(cmd, files.cli.build)));
let distCopy = [files.cli.dist];

// Declare things
log.info('Building with %s for %s on %s arch', pkgNodeVersion, pkgOs, pkgArch);
log.info('Going to clean %j', cleanDirs);
log.info('Going to copy source from %j', _.map(buildCopy, 'src'));
log.info('Going to run %j', buildCmds);
log.info('Artifacts will live at %j', _.map(distCopy, 'dest'));

// Clean
_.forEach(cleanDirs, dir => {
  fs.emptyDirSync(dir);
  log.info('Cleaned up %s', dir);
});

// Copy
_.forEach(buildCopy, item => {
  _.forEach(item.src, dir => {
    const dest = (item.direct) ? item.dest : path.join(item.dest, path.basename(dir));
    fs.copySync(dir, dest, {overwrite: true});
    log.info('Copied source from %s to %s', dir, dest);
  });
});

// Run the commands
return Promise.resolve(buildCmds).each(cmd => shell.sh(cmd.run, cmd.opts))

// Move the built assetz
.then(() => Promise.resolve(distCopy)).each(item => fs.copySync(item.src, item.dest, {overwrite: true}))

// Catch errors and exit
.catch(err => {
  log.error(err);
  process.exit(444);
});
