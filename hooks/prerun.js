// const formatters = require('./../lib/formatters');
'use strict';

module.exports = async ({id, data, cli, debug, task}) => {
  await cli.runHook('pretask', {id, data, cli});
  await cli.runHook(`pretask-${id}`, {data, task, cli});

  // run the interactive prompts
  debug('attempting interactive prompts...');
  // @TODO: i think we mightneed to implement our own thing here?
  // @TODO: formatters.handleInteractive is too deeply lando 3
  // @TODO: we need to replace these with stuff from new handle interactive ^?

  await cli.runHook(id, {id, data});
};
