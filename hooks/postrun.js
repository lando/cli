'use strict';

module.exports = async ({id, result, cli}) => {
  await cli.runHook(`postrun-${id}`, {id, cli});
  await cli.runHook('done', {cli});
  await cli.runHook(`done-${id}`, {cli});
};
