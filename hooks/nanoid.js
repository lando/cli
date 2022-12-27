const debug = require('debug')('lando:@lando/cli@3:hooks:bootstrap-config-pre');

module.exports = async ({config}) => {
  // get some stuff we need
  const {lando} = config;
  // if we dont have an instance id then compute and dump
  if (!lando.config.get(`${lando.config.managed}:system.instance`)) {
    const {nanoid} = require('nanoid');
    const data = {system: {instance: nanoid()}};
    lando.config.save(data);
    lando.config.defaults(data);
    debug('could not locate instance id, setting to %o', lando.config.get('system.instance'));
  }
};
