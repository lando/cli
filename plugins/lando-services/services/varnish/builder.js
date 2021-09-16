'use strict';

// Modules
const _ = require('lodash');
const utils = require('./../../lib/utils');

// Helper to get varnsh ssl nginx
const varnishSsl = options => ({
  command: `/launch.sh /opt/bitnami/nginx/conf/lando.conf`,
  image: 'bitnami/nginx:1.17.10-debian-10-r52',
  depends_on: [options.name],
  environment: {
    NGINX_DAEMON_USER: 'root',
    NGINX_DAEMON_GROUP: 'root',
    LANDO_VARNISH_ALIAS: `${options.name}_varnish`,
    LANDO_NEEDS_EXEC: 'DOEEET',
  },
  user: 'root',
  volumes: [
    `${options.confDest}/launch.sh:/launch.sh`,
    `${options.confDest}/${options.defaultFiles.ssl}:/opt/bitnami/nginx/conf/lando.conf`,
  ],
});

// Builder
module.exports = {
  name: 'varnish',
  config: {
    version: '4.1',
    supported: ['6', '6.0', '4', '4.1'],
    backends: ['appserver'],
    confSrc: __dirname,
    backend_port: '80',
    ssl: false,
    sslExpose: false,
    sources: [],
    defaultFiles: {
      ssl: 'ssl-termination.conf.tpl',
    },
    remoteFiles: {
      vcl: '/etc/varnish/lando.vcl',
    },
  },
  parent: '_lando',
  builder: (parent, config) => class LandoVarnish extends parent {
    constructor(id, options = {}, factory) {
      options = _.merge({}, config, options);
      // Arrayify the backend
      if (!_.isArray(options.backends)) options.backends = [options.backends];
      // Build the default stuff here
      const varnish = {
        image: `wodby/varnish:${options.version}`,
        command: '/docker-entrypoint.sh /etc/init.d/varnishd',
        depends_on: options.backends,
        environment: {
          VARNISH_BACKEND_HOST: options.backends.join(' '),
          VARNISH_BACKEND_PORT: options.backend_port,
          LANDO_NO_USER_PERMS: 'NOTGONNADOIT',
          LANDO_WEBROOT_USER: 'varnish',
          LANDO_WEBROOT_GROUP: 'varnish',
          LANDO_WEBROOT_UID: '100',
          LANDO_WEBROOT_GID: '101',
        },
        networks: {default: {aliases: [`${options.name}_varnish`]}},
        ports: ['80'],
        volumes: [
          `${options.confDest}/lando.default.vcl.tmpl:/etc/gotpl/default.vcl.tmpl`,
          `${options.confDest}/lando.varnishd.init.d.tmpl:/etc/gotpl/varnishd.init.d.tmpl`,
        ],
      };
      // Set LANDO_CUSTOM_VCL
      if (_.has(options, 'config.vcl')) varnish.environment.LANDO_CUSTOM_VCL = 'YOUBETCHA!';
      // Change the me user
      options.meUser = 'varnish';
      // Set some info about our backends
      options.info = {backends: options.backends};
      // Set the varnish
      options.sources.push({services: _.set({}, options.name, varnish)});

      // Spin up an nginx bomb if we need ssl termination
      if (options.ssl) {
        // Set the opts for this custom swill
        const sslOpts = _.assign(_.cloneDeep(options), {
          name: `${options.name}_ssl`,
          type: 'nginx',
          version: 'custom',
          config: `${options.confDest}/${options.defaultFiles.ssl}`,
          info: {backend: 'edge', managed: true},
          meUser: 'www-data',
          overrides: utils.cloneOverrides(options.overrides),
          ssl: true,
          sslExpose: true,
        });

        // Set another lando service we can pass down the stream
        const LandoCompose = factory.get('_lando');
        const nginx = {services: _.set({}, sslOpts.name, varnishSsl(options))};
        const data = new LandoCompose(sslOpts.name, sslOpts, nginx);
        // This is a trick to basically replicate what happens upstream
        options._app.add(data);
        options._app.info.push(data.info);
        // Indicate the relationship on the primary service
        options.info.ssl_served_by = sslOpts.name;
      }

      // Send it downstream
      super(id, options, ..._.flatten(options.sources));
    };
  },
};
