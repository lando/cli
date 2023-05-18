'use strict';

module.exports = plugin => {
  // get scope
  const scope = require('is-root')() ? 'system' : 'user';

  // return type
  if (plugin === '@lando/core') return `${scope}-core`;
  else if (plugin.split('/')[0] === '@lando') return `${scope}-lando`;
  else return scope;
};
