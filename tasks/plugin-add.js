'use strict';

module.exports = lando => {
  return {
    command: 'pa <plugin> [plugins...]',
    run: async options => {
      // deps
      const _ = require('lodash');
      // const Listr = require('listr');
      const Plugin = require('@lando/core-next/plugin');

      // merge plugins together
      const plugins = [options.plugin].concat(options.plugins);
      lando.log.debug('attempting to install plugins', plugins);

      const dest = _.find(lando.config.pluginDirs, {type: require('./../util/get-plugin-type')(plugins[0])}).dir;

      await Plugin.fetch(plugins[0], dest);
      // @TODO: replace forEach wiith a promise.all?

      // console.log(lando.config.pluginDirs)

      // figure out which directory to use?
      // _.forEach(plugins, async plugin => {
      //   const dest = _.find(lando.config.pluginDirs, {type: require('./../util/get-plugin-type')(plugin)}).dir;
      //   const result = await Plugin.fetch(plugin, dest, {
      //     channel: 'stable',
      //     // installer: await this.getComponent('core.plugin-installer'),
      //     type: 'global',
      //   });
      //   console.log(result);
      //   // const pluginDir = lando.config.pluginDirs()
      // })
      // figure out which directory to use?
      // ./plugins, @lando and @lando/core/plugins

     //  console.log(lando.config.pluginDirs)

      // system wide for root, otherwise ~/.lando/plugins

      // console.log(Plugin);

      // do the actual installation

      console.log(options);
      console.log('pa there!');
    },
  };
};
