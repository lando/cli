const debug = require('debug')('lando:@lando/cli:hooks:postrun');

module.exports = async ({id, result, config}) => {
  await config.runHook('before-end', {id, result});
  await config.runHook('cli-after', {id, result});
  await config.runHook(`cli-${id}-after`, {id, result});

  // finally lets rebuild the needed registries
  const {app, context, lando} = config;
  context.app ? app.rebuildRegistry() : lando.rebuildRegistry();
  debug('regenerated plugin and registry caches!');
};
