const debug = require('debug')('lando:@lando/cli:hooks:prerun');
// const formatters = require('./../lib/formatters');

module.exports = async ({id, data, config}) => {
  await config.runHook('cli-answers', {id, data});
  await config.runHook(`cli-${id}-answers`, {id, data});

  // run the interactive prompts
  debug('attempting interactive prompts...');
  // @TODO: i think we mightneed to implement our own thing here?
  // @TODO: formatters.handleInteractive is too deeply lando 3


  // @TODO: we need to replace these with stuff from new handle interactive ^?
  await config.runHook('cli-run', {id, data});
  await config.runHook(`cli-${id}-run`, {id, data});
};
