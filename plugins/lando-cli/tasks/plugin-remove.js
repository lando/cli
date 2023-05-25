'use strict';

module.exports = lando => {
  return {
    command: 'pr <plugin> [plugins...]',
    run: async options => {
      const _ = require('lodash');
      const {ux} = require('@oclif/core');
      const {Manager} = require('listr2');
      const Plugin = require('@lando/core-next/plugin');

      // reset Plugin.debug to use the lando 3 debugger
      Plugin.debug = require('../../../util/debug-shim')(lando.log);

      // merge plugins together, parse/normalize their names and return only unique values
      const plugins = [options.plugin]
        .concat(options.plugins)
        .map(plugin => require('@lando/core-next/utils/parse-package-name')(plugin).name)
        .filter((plugin, index, array) => array.indexOf(plugin) === index);
      lando.log.debug('attempting to remove plugins %j', plugins);

      // renderer and task things
      const renderer = options.debug || options.verbose > 0 ? 'verbose' : lando.cli.getRenderer();
      const rendererOptions = {collapse: false, level: 1, suffixRetries: false, showErrorMessage: true};
      const ctx = {plugins: [], errors: [], added: 0};
      const listrOptions = {renderer, exitOnError: false, concurrent: true, ctx, rendererOptions};
      const tasks = new Manager(listrOptions);

      // prep listr things
      for (const name of plugins) {
        tasks.add({
          title: `Removing ${name}`,
          task: async (ctx, task) => {
            try {
              // see if this is plugin lando is using
              // @NOTE: you must pass in the plugin name here as lando defines it in lando.config.plugins
              const plugin = _.find(lando.config.plugins, {name});

              // add a short wait for ux purposes
              await ux.wait(Math.floor(Math.random() * 2000));

              // if we cannot find the plugin then error?
              if (!plugin) throw Error(`Could not find plugin ${name}!`);

              // do not allow removal of core plugins
              if (plugin.name.startsWith('lando-')) {
                task.skip(`Cannot remove core plugin ${name}`);
                return;
              }

              // instantiate plugin and remove
              task.plugin = new Plugin(plugin.dir);
              task.plugin.remove();

              // update and and return
              task.title = `Removed ${task.plugin.name}@${task.plugin.version} from ${task.plugin.location}`;
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
          throw Error('There was a problem removing some of your plugins. Rerun with -vvv for more details.');
        }

        // otherwise we good!
        console.log();
        console.log('removed %s of %s plugins with %s errors', ctx.added, ctx.plugins.length, ctx.errors.length);
        console.log();
        // clear task caches for good measure
        lando.cli.clearTaskCaches();
      }
    },
  };
};
