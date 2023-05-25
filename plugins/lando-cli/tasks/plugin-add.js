'use strict';

module.exports = lando => {
  return {
    command: 'pa <plugin> [plugins...]',
    run: async options => {
      const _ = require('lodash');
      const fs = require('fs-extra');
      const path = require('path');

      const {Manager} = require('listr2');
      const Plugin = require('@lando/core-next/plugin');

      // @TODOS:
      // * get auth to work
      // * get path based installation to work? npmcli@arborist?
      // * debug ultimate location?
      // * @lando/core fix
      // * also sent user-agten

      // reset Plugin.debug to use the lando 3 debugger
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
              task.plugin = await Plugin.fetch(plugin, {dest: dir});

              // lando 3 plugin loading is at odds with lando 4 plugin installing so we need to move up a directory
              // if the plugin has org scope, also clean up dangling @lando/lando dir
              if (task.plugin.name.split('/').length === 2) {
                const src = task.plugin.location;
                const dest = path.resolve(task.plugin.location, '..', '..', task.plugin.name.split('/')[1]);
                const orgDir = path.resolve(task.plugin.location, '..', '..', task.plugin.name.split('/')[0]);
                // move and log
                fs.moveSync(src, dest, {overwrite: true});
                lando.log.debug('%s org scoped plugin detected, moved up a dir to %s', task.plugin.name, task.plugin.location);
                // remove and log
                fs.rmSync(path.resolve(src, '..'), {recursive: true});
                lando.log.debug('%s removed dangling and presumably/hopefully empty org scope dir %s', task.plugin.name, orgDir);
                // get the plugin info again to confirm we moved it to the correct place
                // @NOTE: we use new Plugin() here instead of Plugin.info to ensure task.plugin remains consistent
                task.plugin = new Plugin(dest);
              }

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
