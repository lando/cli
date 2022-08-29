#!/usr/bin/env node

/**
 * Main CLI entrypoint to use the lando libraries
 * This file is meant to be linked as a "lando" executable.
 *
 * @NOTE: We are duplicating a lot of code here because its less expensive than requiring our lando libs and
 * the users have a need for speed
 *
 * @name lando
 */

'use strict';
// Minimal modules we need to get the cli rolling
const argv = require('@lando/argv');
const fs = require('fs');
const bootstrap = require('./../lib/bootstrap');
const path = require('path');

// Allow envvars to override a few core things
const LOGLEVELCONSOLE = process.env.LANDO_CORE_LOGLEVELCONSOLE;
const ENVPREFIX = process.env.LANDO_CORE_ENVPREFIX;
const USERCONFROOT = process.env.LANDO_CORE_USERCONFROOT;

// Summon the CLI
const Cli = require('./../lib/cli');
const cli = new Cli(ENVPREFIX, LOGLEVELCONSOLE, USERCONFROOT);

// Assemble the lando config here so we have correct knowledge of things
// like the landofile names
const landoConfig = bootstrap.buildConfig(cli.defaultConfig());
// Start by grabbing the hyperdrive config if we can
const hconf = fs.existsSync(landoConfig.hconf) ? require(landoConfig.hconf) : {};
const binPath = landoConfig.env['_'];

// if we have a version mismatch then regenerate it
if (!hconf[binPath] || (landoConfig.version !== hconf[binPath].version)) {
  const yaml = require('js-yaml');
  // get config things we need
  const {landoFile, preLandoFiles, postLandoFiles, version, envPrefix, product} = landoConfig;
  // get lando config
  // @NOTE: right now we just hardcode these in there, in L4 we will actually use the users config
  const globalDir = path.join(landoConfig.userConfRoot, 'plugins');
  const pluginDirs = [
    {type: 'core', dir: 'plugins', depth: 1},
    {type: 'core', dir: path.join('node_modules', '@lando'), depth: 1},
    {type: 'global', dir: globalDir, depth: 2},
  ];

  const plugins = pluginDirs
    .filter(dir => dir.type === 'core')
    .map(dir => ([dir.dir, fs.readdirSync(path.resolve(__dirname, '..', dir.dir))]))
    .map(dir => dir[1].map(plugin => path.join(dir[0], plugin)))
    .flat(Number.POSITIVE_INFINITY)
    .map(dir => ({
      location: `lando://${dir}`,
      manifest: path.join(__dirname, '..', dir, 'plugin.yml'),
      pjson: path.join(__dirname, '..', dir, 'package.json'),
    }))
    .filter(plugin => fs.existsSync(plugin.manifest))
    .map(plugin => Object.assign(plugin, { // eslint-disable-line
      manifest: yaml.safeLoad(fs.readFileSync(plugin.manifest)),
      pjson: fs.existsSync(plugin.pjson) ? require(plugin.pjson) : {},
    }))
    .map(plugin => ({
      name: plugin.manifest.name || plugin.pjson.name,
      package: plugin.manifest.name || plugin.pjson.name,
      deprecated: plugin.deprecated === true,
      hidden: plugin.hidden === true,
      location: plugin.location,
      type: 'core',
      version: plugin.manifest.version || plugin.pjson.version || version,
      isValid: true,
      isInstalled: true,
    }));

  // get app config
  const extension = `.${landoFile.split('.')[landoFile.split('.').length -1]}`;
  const namespace = path.basename(landoFile, extension);
  const landofiles = preLandoFiles.concat([namespace]).concat(postLandoFiles)
    .map(file => file.replace(namespace, ''))
    .map(file => file.replace(extension, ''))
    .map(file => file.replace('.', ''));

  // assemble
  hconf[binPath] = {
    lando: {globalDir, plugins, pluginDirs, version, envPrefix, product},
    app: {landofile: namespace, landofiles,
  }};
  // dump
  fs.mkdirSync(path.dirname(landoConfig.hconf), {recursive: true});
  fs.writeFileSync(landoConfig.hconf, JSON.stringify(hconf, null, 2));
}

// If --hyperdrive is passed in then print out the hyperdrive config and exit
// @NOTE: we do this to minimize the time taken to fully bootstrap lando
if (argv.hasOption(`--${landoConfig.hyperdrive}`)) {
  // we need to make process.stdout and process.stderr blocking so that process.stdout drains completely before
  // process.exit is called
  // see: https://github.com/nodejs/node/issues/6379
  process.stdout._handle.setBlocking(true);
  process.stderr._handle.setBlocking(true);
  process.stdout.write(JSON.stringify(hconf));
  process.exit(0);
}

const _ = require('lodash');
const landoFile = landoConfig.landoFile;
const preLandoFiles = landoConfig.preLandoFiles;
const postLandoFiles = landoConfig.postLandoFiles;
const landoFiles = bootstrap.getLandoFiles(_.flatten([preLandoFiles, [landoFile], postLandoFiles], process.cwd()));
const config = (!_.isEmpty(landoFiles)) ? bootstrap.getApp(landoFiles, cli.defaultConfig().userConfRoot) : {};
const bsLevel = (_.has(config, 'recipe')) ? 'APP' : 'TASKS';

// Lando cache stuffs
process.lando = 'node';
process.landoTaskCacheName = '_.tasks.cache';
process.landoTaskCacheFile = path.join(cli.defaultConfig().userConfRoot, 'cache', process.landoTaskCacheName);
process.landoAppTaskCacheFile = !_.isEmpty(config) ? config.toolingCache : undefined;

// Check for sudo usage
cli.checkPerms();

// Check to see if we have a recipe and if it doesn't have a tooling cache lets enforce a manual cache clear
if (bsLevel === 'APP' && !fs.existsSync(config.toolingCache)) {
  if (fs.existsSync(process.landoTaskCacheFile)) fs.unlinkSync(process.landoTaskCacheFile);
}

// Print the cli if we've got tasks cached
if (fs.existsSync(process.landoTaskCacheFile)) {
  cli.run(bootstrap.getTasks(config, cli.argv()), config);
// Otherwise min bootstrap lando so we can generate the task cache first
} else {
  // NOTE: we require lando down here because it adds .5 seconds if we do it above
  const Lando = require('./../lib/lando');
  const lando = new Lando(cli.defaultConfig(config));
  // Bootstrap lando at the correct level
  lando.bootstrap(bsLevel).then(lando => {
    // If bootstrap level is APP then we need to get and init our app to generate the app task cache
    if (bsLevel === 'APP') {
      lando.getApp().init().then(() => cli.run(bootstrap.getTasks(config, cli.argv()), config));
    // Otherwise run as yooz
    } else {
      cli.run(bootstrap.getTasks(config, cli.argv()), config);
    }
  });
}
