const debug = require('debug')('lando:@lando/cli@3:hooks:prerun');

module.exports = async stuff => {
  debug('prerun args are %o', stuff);
};
