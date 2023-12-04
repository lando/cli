'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (dir, {short = false} = {}) => {
  // get head
  const head = path.join(dir, '.git', 'HEAD');
  // if we dont have it then return false
  if (!fs.existsSync(head)) return false;

  // read file contents
  const ref = fs.readFileSync(head, {encoding: 'utf-8'});
  console.log(ref);




  console.log(dir);
};
