'use strict';

// Modules
const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');

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
        || windowsHome()
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
    return yaml.safeLoad(fs.readFileSync(file));
  } catch (e) {
    throw new Error(`There was a problem with parsing ${file}. Ensure it is valid YAML! ${e}`);
  }
};

/*
 * Helper to traverse up directories from a start point
 */
const traverseUp = file => _(_.range(path.dirname(file).split(path.sep).length))
  .map(end => _.dropRight(path.dirname(file).split(path.sep), end).join(path.sep))
  .map(dir => path.join(dir, path.basename(file)))
  .value();

/*
 * Helper to load a very basic app
 */
exports.getApp = (files, userConfRoot) => {
  const config = exports.merge({}, ..._.map(files, file => loadLandoFile(file)));
  return _.merge({}, config, {
    configFiles: files,
    metaCache: `${config.name}.meta.cache`,
    project: _.toLower(config.name).replace(/_|-|\.+/g, ''),
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
  envPrefix = 'LANDO_CORE',
  userConfRoot = path.join(os.homedir(), '.lando'),
  srcRoot = path.resolve(__dirname, '..'),
} = {}) => ({
  configSources: [path.join(srcRoot, 'config.yml'), path.join(userConfRoot, 'config.yml')],
  envPrefix,
  landoFile: '.lando.yml',
  preLandoFiles: ['.lando.base.yml', '.lando.dist.yml', '.lando.recipe.yml', '.lando.upstream.yml'],
  postLandoFiles: ['.lando.local.yml', '.lando.user.yml'],
  runtime: 3,
  srcRoot,
  userConfRoot,
});

/*
 * Helper to find lando files we can use
 */
exports.getLandoFiles = (files = [], startFrom = process.cwd()) => _(files)
  .flatMap(file => traverseUp(path.resolve(startFrom, file)))
  .sortBy().reverse()
  .filter(file => fs.existsSync(file) && path.isAbsolute(file))
  .thru(files => _.isEmpty(files) ? [] : [_.first(files)])
  .flatMap(dirFile => _.map(files, file => path.join(path.dirname(dirFile), file)))
  .filter(file => fs.existsSync(file))
  .value();

/*
 * Filter process.env by a given prefix
 */
exports.loadEnvs = prefix => _(process.env)
  // Only muck with prefix_ variables
  .pickBy((value, key) => _.includes(key, prefix))
  // Prep the keys for consumption
  .mapKeys((value, key) => _.camelCase(key.replace(prefix, '')))
  // If we have a JSON string as a value, parse that and assign its sub-keys
  .mapValues(exports.tryConvertJson)
  // Resolve the lodash wrapper
  .value();

/*
 * Merge in config file if it exists
 */
exports.loadFile = file => {
  // if the file doesnt exist then return an empty object
  if (!fs.existsSync(file)) return {};
  // otherwise load the file and return it
  return yaml.safeLoad(fs.readFileSync(file));
};

/*
 * Uses _.mergeWith to concat arrays, this helps replicate how Docker Compose
 * merges its things
 *
 */
exports.merge = (old, ...fresh) => _.mergeWith(old, ...fresh, (s, f) => {
  if (_.isArray(s)) return _.uniq(s.concat(f));
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
