const debug = require('debug')('lando:@lando/cli:hooks:postrun');

module.exports = async ({id, result, config}) => {
  await config.runHook('before-end', {id, result});
  await config.runHook('cli-after', {id, result});
  await config.runHook(`cli-${id}-after`, {id, result});

  // finally lets rebuild the needed caches
  const {context, lando, minapp} = config;
  // rebuild lando registry
  lando.rebuildRegistry();
  // rebuild app registry if we need to
  if (context.app) minapp.rebuildRegistry();
  debug('regenerated plugin, registry and cli task caches!');
};
