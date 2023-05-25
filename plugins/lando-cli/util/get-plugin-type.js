'use strict';

module.exports = plugin => {
  // get scope
  const scope = require('is-root')() ? 'system' : 'user';
  // return type
  return (plugin.split('/')[0] === '@lando') ? `${scope}-lando`: scope;
};
