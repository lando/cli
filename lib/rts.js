'use strict';

// Modules
const fs = require('fs');
const os = require('os');
const path = require('path');

/*
 * Get oclif base dir based on platform
 */
const getOClifBase= product => {
  const base = process.env['XDG_CACHE_HOME']
    || (process.platform === 'win32' && process.env.LOCALAPPDATA)
    || path.join(getOClifHome(), '.cache');
  return path.join(base, product);
};

/*
 * Get oclif home dir based on platform
 */
const getOClifHome = () => {
  switch (process.platform) {
    case 'darwin':
    case 'linux':
      return process.env.HOME || os.homedir() || os.tmpdir();
    case 'win32':
      return process.env.HOME
        || (process.env.HOMEDRIVE && process.env.HOMEPATH && path.join(process.env.HOMEDRIVE, process.env.HOMEPATH))
        || process.env.USERPROFILE
        || os.homedir()
        || os.tmpdir();
  }
};

const macosCacheDir = product => {
  return process.platform === 'darwin' ? path.join(getOClifHome(), 'Library', 'Caches', product) : undefined;
};

/*
 * Helper to load landofile
 */
const loadLandoFile = file => {
  try {
    return require('@lando/core-next/utils/read-file')(file);
  } catch (e) {
    throw new Error(`There was a problem with parsing ${file}. Ensure it is valid YAML! ${e}`);
  }
};

/*
 * Helper to load a very basic app
 */
exports.getApp = (files, userConfRoot) => {
  const config = exports.merge({}, ...files.map(file => loadLandoFile(file)));

  // if no name then return empty object
  if (!config.name) return {};

  return require('lodash/merge')({}, config, {
    configFiles: files,
    metaCache: `${config.name}.meta.cache`,
    project: config.name.replace(/_|-|\.+/g, '').toLowerCase(),
    root: path.dirname(files[0]),
    composeCache: path.join(userConfRoot, 'cache', `${config.name}.compose.cache`),
    toolingCache: path.join(userConfRoot, 'cache', `${config.name}.tooling.cache`),
    toolingRouter: path.join(userConfRoot, 'cache', `${config.name}.tooling.router`),
  });
};

/*
 * Helper to load in some basic config
 */
exports.getDefaultConfig = ({
  envPrefix = 'LANDO',
  runtime = 3,
  userConfRoot = path.join(os.homedir(), '.lando'),
  srcRoot = path.resolve(__dirname, '..'),
} = {}) => ({
  configSources: [path.join(srcRoot, 'config.yml'), path.join(userConfRoot, 'config.yml')],
  envPrefix,
  landoFile: '.lando.yml',
  preLandoFiles: ['.lando.base.yml', '.lando.dist.yml', '.lando.recipe.yml', '.lando.upstream.yml'],
  postLandoFiles: ['.lando.local.yml', '.lando.user.yml'],
  runtime,
  srcRoot,
  userConfRoot,
});

/*
 * Helper to find lando files we can use
 */
exports.getLandoFiles = (files = [], startFrom = process.cwd()) => {
  const lfiles = require('lodash/sortBy')(require('@lando/core-next/utils/traverse-up')(files, startFrom))
    .reverse()
    .filter(file => fs.existsSync(file) && path.isAbsolute(file))
    // @NOTE: dont really understand why the rest of this exists but TOO RISKY to remove
    .map(dirFile => files.map(file => path.join(path.dirname(dirFile), file)).filter(file => fs.existsSync(file)));

  return lfiles.length === 0 ? [] : lfiles[0];
};

/*
 * Helper to get a system wide path
 */
exports.getSysDataPath = (id = 'lando') => {
  switch (process.platform) {
    case 'darwin':
      return path.join('/', 'Library', 'Application Support', `${id[0].toUpperCase()}${id.slice(1).toLowerCase()}`);
    case 'linux':
      return path.join('/', 'srv', `${id.toLowerCase()}`);
    case 'win32':
      return path.join(process.env.PROGRAMDATA || process.env.ProgramData, `${id[0].toUpperCase()}${id.slice(1).toLowerCase()}`);
  }
};

/*
 * Filter process.env by a given prefix
 */
exports.loadEnvs = prefix => {
  return Object.fromEntries(Object.keys(process.env)
    // filter out keys that dont make sense
    .filter(key => key.startsWith(`${prefix}_`))
    // map to key/pair values
    .map(key => ([
      require('lodash/camelCase')(key.replace(`${prefix}_`, '')),
      exports.tryConvertJson(process.env[key]),
    ])));
};

/*
 * Merge in config file if it exists
 */
exports.loadFile = file => {
  // if the file doesnt exist then return an empty object
  if (!fs.existsSync(file)) return {};
  // otherwise load the file and return it
  return require('@lando/core-next/utils/read-file')(file);
};

/*
 * Uses _.mergeWith to concat arrays, this helps replicate how Docker Compose
 * merges its things
 *
 */
exports.merge = (old, ...fresh) => require('lodash/mergeWith')(old, ...fresh, (s, f) => {
  if (Array.isArray(s)) return require('lodash/uniq')(s.concat(f));
});

/*
 * Attempt to parse a JSON string to an objects
 *
 */
exports.tryConvertJson = value => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

/*
 * This should only be needed for linux
 */
exports.getOclifCacheDir = (product = 'lando') => {
  return process.env[`${product.toUpperCase()}_CACHE_DIR`]
    || macosCacheDir(product)
    || getOClifBase(product);
};
