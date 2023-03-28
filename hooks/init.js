'use strict';

module.exports = async ({id, argv, cli}) => {
  // hook for preflight checks
  await cli.runHook('init-preflight');

  // hook to mod the product
  await cli.runHook('init-product', {product: cli.product, [cli.product.id]: cli.product});
  await cli.runHook(`init-product-${cli.product.id}`, {product: cli.product, [cli.product.id]: cli.product});

  // hook to mod the app if applicable
  if (cli.context.app) await cli.runHook('init-app', {app: cli.app});
  if (cli.context.app) await cli.runHook(`init-app-${cli.app.name}`, {app: cli.app});

  // hook to modify the config @NOTE: this will be the config for whatever the context is
  await cli.runHook('init-config', {config: cli.config});
  // if we do the above then we should have what we need in lando.registry or app.registry
  await cli.runHook('init-tasks', {id, argv, tasks: cli.tasks});
  // final hook to do stuff to the init
  await cli.runHook('init-final');
};
