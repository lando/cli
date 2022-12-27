const debug = require('debug')('lando:@lando/cli@3:hooks:bootstrap-app-pre');
const fs = require('fs');
const get = require('lodash/get');
const path = require('path');

module.exports = async ({config}) => {
  // get some stuff we need
  const {lando} = config;
  const landofile = lando.config.get('core.landofile');

  // try to discover if we have app context or not
  const landofiles = [`${landofile}.yaml`, `${landofile}.yml`];
  const landofilePath = lando.findApp(landofiles, process.cwd());

  // if we have an file then lets set it in the config for downstream purposes
  if (fs.existsSync(landofilePath)) {
    // get a minapp
    const MinApp = lando.getClass('app.minapp');
    const app = new MinApp({landofile: landofilePath, config: lando.config.getUncoded(), plugins: lando.getPlugins()});
    app.setCorePlugins(get(lando, 'lando.plugins', []));
    // set and report
    config.app = app;
    debug('discovered an app called %o at %o', config.app.name, path.dirname(landofilePath));
  }
};
