'use strict';

// adds required methods to ensure the lando v3 debugger can be injected into v4 things
module.exports = log => {
  // save the old debug
  const debug = log.debug;
  const fs = log.filters.length;

  // rework log.debug so it clears filters
  log.debug = (...args) => {
    if (log.filters.length > fs) log.filters.pop();
    debug(...args);
  };

  // contract and replace should do nothing
  log.debug.contract = () => log.debug;
  log.debug.replace = () => log.debug;

  // extend should add a rewrite rule to replace DEBUG with the extended name?
  log.debug.extend = name => {
    if (log.filters.length === fs) log.filters.push((level, msg) => `${name} ${msg}`);
    return debug;
  };
  return log.debug;
};
