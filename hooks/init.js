'use strict';

module.exports = async ({id, argv, config, cli}) => {
  // hook for preflight checks
  await cli.runHook('init-preflight', {config});

  // hook to mod the product
  await cli.runHook('init-product', {product: config.product, [config.product.id]: config.product});
  await cli.runHook(`init-product-${config.product.id}`, {product: config.product, [config.product.id]: config.product});

  // hook to mod the app if applicable
  if (config.context.app) await cli.runHook('init-app', {app: config.app});
  if (config.context.app) await cli.runHook(`init-app-${config.app.name}`, {app: config.app});

  // hook to modify the config @NOTE: this will be the config for whatever the context is
  await cli.runHook('init-config', {config: config.context.app ? config.app.config : config.product.config});

  // if we do the above then we should have what we need in lando.registry or app.registry
  await cli.runHook('init-tasks', {id, argv, tasks: config.tasks});

  // final hook to do stuff to the init
  await cli.runHook('init-final', {config});
};
