'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (files = [], startFrom = process.cwd()) => {
  const lfiles = require('lodash/sortBy')(require('@lando/core-next/utils/traverse-up')(files, startFrom))
    .reverse()
    .filter(file => fs.existsSync(file) && path.isAbsolute(file))
    // @NOTE: dont really understand why the rest of this exists but TOO RISKY to remove
    .map(dirFile => files.map(file => path.join(path.dirname(dirFile), file)).filter(file => fs.existsSync(file)));

  return lfiles.length === 0 ? [] : lfiles[0];
};
