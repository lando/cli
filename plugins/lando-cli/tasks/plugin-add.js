'use strict';

module.exports = lando => {
  return {
    command: 'pa <plugin> [plugins...]',
    options: {
      auth: {
        describe: 'Sets auth globally or to a scope',
        alias: ['a'],
        array: true,
        default: [],
      },
      registry: {
        describe: 'Sets registry globally or to a scope',
        alias: ['r', 's', 'scope'],
        array: true,
        default: [],
      },
    },

    run: async options => {
      const _ = require('lodash');
      const config2Lopts = require('../util/config-2-lopts');
      const lopts2Popts = require('../util/lopts-2-popts');

      const Plugin = require('@lando/core-next/plugin');
      const {Manager} = require('listr2');

      // we need to merge various Plugin config soruces together to set the plugin config
      // lets start with getting stuff directly from lando.config
      options.config = lopts2Popts(config2Lopts(lando.config.pluginConfig));
      // lets merge passed in options on top of lopts
      options.config = lopts2Popts(options, options.config);
      // finanly lets rebase ontop of any npm config we may have
      options.config = _.merge({}, options.config);

      // reset Plugin static defaults for v3 purposes
      Plugin.config = options.config;
      Plugin.debug = require('../../../util/debug-shim')(lando.log);

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
              task.plugin = await require('../util/fetch-plugin')(plugin, {config: Plugin.config, dest: dir}, Plugin);

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
