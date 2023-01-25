const fs = require('fs');
const path = require('path');

module.exports = ({argv, config, configFile, id = 'lando'}) => {
  // determine which loader to use
  // @NOTE: this assumes the user has not changed the user global plugin dir
  const internalBase = path.join(__dirname, '..', 'node_modules', '@lando', 'core-next');
  const externalBase = path.join(config.dataDir, 'plugins', '@lando', 'core-next');
  const coreBase = fs.existsSync(externalBase) ? externalBase : internalBase;

  // start the lando config by setting the default bootstrapper and its config
  const systemTemplate = path.join(__dirname, '..', 'config', 'system.js');
  const userTemplate = path.join(__dirname, '..', 'config', 'user.yaml');

  return {
    app: path.join(coreBase, 'core', 'app.js'),
    bootstrapper: path.join(coreBase, 'core', 'bootstrap.js'),
    config: {
      argv,
      cached: path.join(config.cacheDir, 'config.json'),
      env: id.toUpperCase(),
      id,
      managed: 'global',
      // add oclif config so we can use it in our js templates
      oclif: config,
      // sources are loading in increasing priority into the main config
      sources: {
        system: path.join(config.dataDir, 'system.json'),
        global: path.join(config.dataDir, 'global.json'),
        user: path.join(config.configDir, 'config.yaml'),
        overrides: configFile && fs.existsSync(configFile) ? path.resolve(configFile) : undefined,
      },
      // templates can prepopulate or override sources before they are loaded
      templates: {
        system: {source: systemTemplate, dest: path.join(config.dataDir, 'system.json'), replace: true},
        global: {data: {}, dest: path.join(config.dataDir, 'global.json')},
        user: {source: userTemplate, dest: path.join(config.configDir, 'config.yaml')},
      },
    },
  };
};
