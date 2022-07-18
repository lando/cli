'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

module.exports = lando => ({
  command: lando.config.hyperdrive,
  level: 'tasks',
  run: options => {
    // get the things we need
    const {landoFile, preLandoFiles, postLandoFiles, userConfRoot, version} = lando.config;
    const extension = `.${_.last(landoFile.split('.'))}`;

    // stuff we need for core
    const namespace = path.basename(landoFile, extension);
    const files = _(preLandoFiles.concat([namespace]).concat(postLandoFiles))
      .map(file => file.replace(namespace, ''))
      .map(file => file.replace(extension, ''))
      .value();

    // @TODO: list of plugin dirs by "namespace"
    // @TODO: what kind of components should be loaded before plugins? if anything?
    // @NOTE: core means "internal to lando" eg contained within the distributed binary or source code
    // @NOTE: global means installed on the filesystem but not coupled to a given app
    const pluginDirs = [
      {type: 'core', dir: 'plugins', depth: 1},
      {type: 'core', dir: path.join('node_modules', '@lando'), depth: 1},
      {type: 'global', dir: path.join(userConfRoot, 'plugins'), depth: 2},
    ];

    // @TODO: we need to make this into an object at the end so its overrideable
    const plugins = _(pluginDirs)
      .filter(dir => dir.type === 'core')
      .map(dir => ([dir.dir, fs.readdirSync(path.resolve(__dirname, '..', '..', '..', dir.dir))]))
      .map(dir => _.map(dir[1], plugin => path.join(dir[0], plugin)))
      .flatten()
      .map(dir => ({
        location: `lando://${dir}`,
        manifest: path.join(__dirname, '..', '..', '..', dir, 'plugin.yml'),
        pjson: path.join(__dirname, '..', '..', '..', dir, 'package.json'),
      }))
      .filter(plugin => fs.existsSync(plugin.manifest))
      .map(plugin => _.merge({}, plugin, {
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
      }))
      .sortBy('name')
      .value();

    // we need to make process.stdout and process.stderr blocking so that process.stdout drains completely before
    // process.exit is called
    // see: https://github.com/nodejs/node/issues/6379
    process.stdout._handle.setBlocking(true);
    process.stderr._handle.setBlocking(true);
    process.stdout.write(JSON.stringify({landofile: namespace, landofiles: files, pluginDirs, plugins, version}));
  },
});
