'use strict';

const path = require('path');
const uniq = require('lodash/uniq');

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
  const config = require('@lando/core/utils/legacy-merge')({}, ...files.map(file => loadLandoFile(file)));
  // if no name then return empty object
  if (!config.name) return {};
  // cast the name to a string...just to make sure.
  config.name = config.name.toString();
  // slugify project
  config.project = require('@lando/core/utils/slugify')(config.name);

  // discover a default/primary service for legacy considerations
  const services = Object.entries(config?.services ?? []).map(([service, config]) => ({name: service, ...config}));
  const apis = uniq(services.map(service => parseInt(service.api)));

  // if the api is only v4 then look for a primary service or the first one if none is set
  if (apis.length === 1 && parseInt(apis[0]) === 4) {
    const service = services.find(service => service.primary === true) ?? services[0] ?? {};
    config.primary = service.name;

  // otherwise this is a mixed environment so default appserver or first non v4 service if it exists
  } else {
    const service = services.find(service => service.name === 'appserver') ?? services.find(service => parseInt(service.api) !== 4) ?? {};
    config.primary = service.name;
  }

  // if we still dont have a primary service it might be because its hidden in a recipe, if that is the case then
  // we can assume its just the appserver?
  if (!config.primary && config.recipe) config.primary = 'appserver';

  // merge and return
  return require('lodash/merge')({}, config, {
    configFiles: files,
    composeCache: path.join(userConfRoot, 'cache', `${config.project}.compose.cache`),
    metaCache: `${config.project}.meta.cache`,
    recipeCache: path.join(userConfRoot, 'cache', `${config.project}.recipe.cache`),
    root: path.dirname(files[0]),
    toolingRouter: path.join(userConfRoot, 'cache', `${config.project}.tooling.router`),
  });
};
