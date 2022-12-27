const debug = require('debug')('lando:@lando/cli@3:hooks:postrun');

module.exports = async stuff => {
  debug('postrun args are %o', stuff);
};
