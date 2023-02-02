'use strict';

module.exports = async ({config, cli, debug}) => {
  // finally lets rebuild the needed caches
  const {app, context, product} = config;
  // rebuild lando registry
  product.reinit();
  // rebuild app registry if we need to
  if (context.app) app.reinit();
  // rebuild tasks and hooks
  cli.getTasks(config.context.app ? config.app : product, [product, cli]);
  cli.getHooks(config.context.app ? config.app : product);
  // log
  debug('reinitialized cli, app and product caches!');
};
