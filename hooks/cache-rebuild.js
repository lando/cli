
module.exports = async ({id, result, config, debug}) => {
  // finally lets rebuild the needed caches
  const {cli, context, lando, minapp, tasksCacheId} = config;
  // rebuild lando registry
  lando.rebuildRegistry();
  // rebuild app registry if we need to
  if (context.app) minapp.rebuildRegistry();
  // rebuild tasks
  cli.getTasks({
    id: tasksCacheId,
    noCache: true,
    registry: (context.app) ? minapp.getRegistry() : lando.getRegistry(),
  }, [lando, cli]);
  debug('regenerated plugin, registry and cli task caches!');
};
