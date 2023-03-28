'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const which = require('which');

module.exports = options => {
  // 0 0 0 destruct 0
  const {
    arch,
    bin,
    cache,
    cacheDir,
    configDir,
    coreDir,
    dataDir,
    env,
    errlog,
    home,
    id,
    platform,
    root,
    shell,
    version,
    windows,
    userAgent,
  } = options;

  // get other stuff
  const logsDir = path.join(dataDir, 'logs');
  const syscacheDir = path.resolve(cacheDir, '..', `${id}.system`);
  const user = os.userInfo();

  // create dirs
  fs.mkdirSync(path.dirname(logsDir), {recursive: true});

  // return the system config
  return {
    core: {
      app: 'landofile-legacy-app',
      appfile: '.lando',
      appfiles: ['base', 'dist', 'recipe', 'upstream', '', 'local', 'user'],
      caching: cache,
      product: 'lando',
    },
    plugin: {
      dirs: [
        {
          id: 'cli',
          dir: path.resolve(__dirname, '..'),
          depth: 0,
          weight: -100,
        },
        {
          id: 'core-updates',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next'),
          depth: 0,
        },
        {
          id: 'core-plugins-updates',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next', 'plugins'),
          depth: 2,
        },
        {
          id: 'user',
          dir: path.join(dataDir, 'plugins'),
          depth: 2,
        },
      ],
    },
    system: {
      arch,
      bin,
      cacheDir,
      configDir,
      coreDir,
      dataDir,
      dev: !Object.hasOwn(process, 'pkg'),
      env,
      errlog,
      freemem: os.freemem() / 1_073_741_824,
      gid: user.gid,
      home,
      id: id || 'lando',
      interface: 'cli',
      leia: Object.hasOwn(process.env, 'LEIA_PARSER_RUNNING'),
      logsDir,
      mode: 'cli',
      packaged: Object.hasOwn(process, 'pkg'),
      platform,
      product: id || 'lando',
      productPath: path.join(coreDir, 'components', 'lando'),
      root,
      server: 'node',
      shell: which.sync(shell, {nothrow: true}),
      syscacheDir,
      totalmem: os.totalmem() / 1_073_741_824,
      version,
      windows,
      uid: user.uid,
      user: user.username,
      userRoot: require('is-root')(),
      userAgent,
    },
    updates: {
      notify: true,
    },
    // dockerDesktop: {
    //   required: '>=3.6.5 && <=5.0.0',
    //   scripts: path.resolve(root, 'scripts', 'docker-desktop'),
    //   server: {
    //     socketPath: (platform === 'win32') ? '//./pipe/docker_engine' : '/var/run/docker.sock',
    //     // host: '192.168.1.10',
    //     // port: process.env.DOCKER_PORT || 2375,
    //     // ca: fs.readFileSync('ca.pem'),
    //     // cert: fs.readFileSync('cert.pem'),
    //     // key: fs.readFileSync('key.pem'),
    //     // version: 'v1.25',
    //   },
    //   supported: '>=3.6.5 && <=4.10.5',
    //   // npmrc: '//npm.pkg.github.com/:_authToken=GH_ACCESS_TOKEN\n@namespace:registry=https://npm.pkg.github.com',
    // },
    // dockerEngine: {
      // required: '>=3.6.5 && <=5.0.0',
      // scripts: path.resolve(root, 'scripts', 'docker-desktop'),
      // server: {
      //   socketPath: (platform === 'win32') ? '//./pipe/docker_engine' : '/var/run/docker.sock',
      //   // host: '192.168.1.10',
      //   // port: process.env.DOCKER_PORT || 2375,
      //   // ca: fs.readFileSync('ca.pem'),
      //   // cert: fs.readFileSync('cert.pem'),
      //   // key: fs.readFileSync('key.pem'),
      //   // version: 'v1.25',
      // },
      // supported: '>=3.6.5 && <=4.10.5',
    // },
    // dockerPluginInstaller: {
    //   image: 'node:16-alpine',
    // },
    // Allows you to pass env value to Docker, Docker Compose, etc.
    // @TODO: figure out how to implement this exactly
    // env: {},
  };
};
