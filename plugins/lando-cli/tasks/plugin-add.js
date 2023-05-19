'use strict';

module.exports = lando => {
  return {
    command: 'pa <plugin> [plugins...]',
    run: async options => {
      const _ = require('lodash');
      const {Manager} = require('listr2');
      const Plugin = require('@lando/core-next/plugin');

      // @TODOS:
      // * throw errors better? @lando/cli @lando/core fix
      // * proper directory placement inlcuding post moving for non @lando
      // * debug ultimate location?
      // * clear the cache in the finally?
      // * channel support?

      // * get foxspark to work
      // * get path based installation to work

      // reset Plugin.debug to use the lando 3 debugger
      Plugin.debug = require('../../../util/debug-shim')(lando.log);

      // merge plugins together
      const plugins = [options.plugin].concat(options.plugins);
      lando.log.debug('attempting to install plugins', plugins);

      const renderer = options.debug || options.verbose > 0 ? 'verbose' : lando.cli.getRenderer();
      const rendererOptions = {collapse: false, level: 1, suffixRetries: false, showErrorMessage: true};
      const ctx = {plugins: [], errors: [], added: 0};
      const listrOptions = {renderer, exitOnError: false, concurrent: true, ctx, rendererOptions};
      const tasks = new Manager(listrOptions);

      // prep listr things
      for (const plugin of plugins) {
        tasks.add({
          title: `Adding ${plugin}`,
          task: async (ctx, task) => {
            try {
              // attempt to compute the destination to install the plugin
              const dest = _.find(lando.config.pluginDirs, {type: require('../util/get-plugin-type')(plugin)}).dir;
              // add the plugin
              task.plugin = await Plugin.fetch(plugin, dest);

              // if this is not a @lando package then we need to move the plugin a directory up

              // update and and return
              task.title = `Installed ${task.plugin.name}@${task.plugin.version}`;
              ctx.added++;
              return task.plugin;

            // if we have an error then add it to the status object and throw
            // @TODO: make sure we force remove any errered plugins?
            } catch (error) {
              ctx.errors.push(error);
              throw error;

            // add the plugin regardless of the status
            } finally {
              ctx.plugins.push(task.plugin);
            }
          },
        });
      }

      // try to fetch the plugins
      try {
        await tasks.runAll();

      // if we have errors then lets print them out
      } finally {
        // otherwise
        console.log();
        console.log('added %s of %s plugins with %s errors', ctx.added, ctx.plugins.length, ctx.errors.length);
        console.log();

        // handle errors here
        if (ctx.errors.length > 0) {
          // print the full errors
          for (const error of ctx.errors) lando.log.debug(error);
          throw Error('There was a problem installing some of your plugins. Rerun with -vvv for more details.');
        }
      }
    },
  };
};
