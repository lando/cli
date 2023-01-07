const fs = require('fs');
const os = require('os');
const path = require('path');
const which = require('which');

module.exports = ({options}) => {
  // get oclicf things we need
  const {id, env, oclif} = options;
  const {arch, bin, cacheDir, configDir, dataDir, errlog, home, platform, root, shell, version, windows, userAgent} = oclif;

  // get other stuff
  const logsDir = path.join(dataDir, 'logs');
  const user = os.userInfo();

  // create dirs
  fs.mkdirSync(path.dirname(logsDir), {recursive: true});

  // return the system config
  return {
    core: {
      debugspace: id || path.basename(process.argv[1]) || 'lando',
    },
    plugin: {
      showCore: true,
      // these are "additional" directories to scan for plugins on top of the "core/internal" that are loaded no
      // matter what
      dirs: {
        userCore: {
          type: 'user',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next'),
          depth: 0,
        },
        userCorePlugins: {
          type: 'user',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next', 'plugins'),
          depth: 2,
        },
        user: {
          type: 'user',
          dir: path.join(dataDir, 'plugins'),
          depth: 2,
        },
      },
    },
    registry: {},
    system: {
      arch,
      bin,
      cacheDir,
      configDir,
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
      root,
      server: 'node',
      shell: which.sync(shell, {nothrow: true}),
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
    dockerDesktop: {
      required: '>=3.6.5 && <=5.0.0',
      scripts: path.resolve(root, 'scripts', 'docker-desktop'),
      server: {
        socketPath: (platform === 'win32') ? '//./pipe/docker_engine' : '/var/run/docker.sock',
        // host: '192.168.1.10',
        // port: process.env.DOCKER_PORT || 2375,
        // ca: fs.readFileSync('ca.pem'),
        // cert: fs.readFileSync('cert.pem'),
        // key: fs.readFileSync('key.pem'),
        // version: 'v1.25',
      },
      supported: '>=3.6.5 && <=4.10.5',
      // npmrc: '//npm.pkg.github.com/:_authToken=GH_ACCESS_TOKEN\n@namespace:registry=https://npm.pkg.github.com',
    },
    dockerEngine: {
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
    },
    dockerPluginInstaller: {
      image: 'node:16-alpine',
    },
    // Allows you to pass env value to Docker, Docker Compose, etc.
    // @TODO: figure out how to implement this exactly
    env: {},
  };
};
