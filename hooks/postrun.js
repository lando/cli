'use strict';

module.exports = async ({id, cli, result}) => {
  await cli.runHook('posttask', {id, cli, result});
  await cli.runHook(`posttask-${id}`, {id, cli, result});
  await cli.runHook('done', {cli});
  await cli.runHook(`done-${id}`, {cli});
};
