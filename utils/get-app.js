'use strict';

const path = require('path');

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

module.exports = (files, userConfRoot) => {
  const config = require('@lando/core/utils/merge')({}, ...files.map(file => loadLandoFile(file)));
  // if no name then return empty object
  if (!config.name) return {};
  // cast the name to a string...just to make sure.
  config.name = config.name.toString();
  // slugify project
  config.project = require('@lando/core/utils/slugify')(config.name);

  // merge and return
  return require('lodash/merge')({}, config, {
    configFiles: files,
    metaCache: `${config.project}.meta.cache`,
    root: path.dirname(files[0]),
    composeCache: path.join(userConfRoot, 'cache', `${config.project}.compose.cache`),
    toolingCache: path.join(userConfRoot, 'cache', `${config.project}.tooling.cache`),
    toolingRouter: path.join(userConfRoot, 'cache', `${config.project}.tooling.router`),
  });
};
