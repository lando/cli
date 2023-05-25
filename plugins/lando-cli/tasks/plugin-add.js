'use strict';

module.exports = lando => {
  return {
    command: 'pa <plugin> [plugins...]',
    run: async options => {
      const _ = require('lodash');
      const Plugin = require('@lando/core-next/plugin');
      const {Manager} = require('listr2');

      // reset Plugin.debug to use the lando 3 debugger
      Plugin.debug = require('../../../util/debug-shim')(lando.log);

      // @TODOS:
      // * get auth to work
      // * get path based installation to work? npmcli@arborist?
      // * debug ultimate location?
      // * also sent user-agten

      // merge plugins together
      const plugins = [options.plugin].concat(options.plugins);
      lando.log.debug('attempting to install plugins %j', plugins);

      // renderer and task things
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
              // @NOTE: is it possible for this to ever be undefined?
              const {dir} = _.find(lando.config.pluginDirs, {type: require('../util/get-plugin-type')(plugin)});

              // add the plugin
              task.plugin = await require('../util/fetch-plugin')(plugin, {dest: dir}, Plugin);

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
      } finally {
        // if we have errors then lets print them out
        if (ctx.errors.length > 0) {
          // print the full errors
          for (const error of ctx.errors) lando.log.debug(error);
          throw Error('There was a problem installing some of your plugins. Rerun with -vvv for more details.');
        }

        // otherwise we good!
        console.log();
        console.log('added %s of %s plugins with %s errors', ctx.added, ctx.plugins.length, ctx.errors.length);
        console.log();
        // clear task caches for good measure
        lando.cli.clearTaskCaches();
      }
    },
  };
};
