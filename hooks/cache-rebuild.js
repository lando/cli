'use strict';

module.exports = async ({cli, debug}) => {
  const {app, context, product} = cli;

  // reinit product syscache if caching is on
  if (product.config.get('core.caching')) {
    debug('reinitializing %o syscache!', product.id);
    product.reinit();
    debug('reinitialized %o syscache!', product.id);
  }

  // ditto for app
  if (context.app && app.config.get('core.caching')) {
    debug('reinitializing %o syscache!', app.name);
    app.reinit();
    debug('reinitialized %o syscache!', app.name);
  }

  // ditto for CLI
  if (cli.cache) {
    debug('reinitializing %o syscache!', 'cli');
    cli.reinit();
    cli.getHelp(cli.getTasks(context.app ? app : product), [product, cli]);
    cli.getHooks(context.app ? app : product);
    debug('reinitialized %o cache!', 'cli');
  }
};
