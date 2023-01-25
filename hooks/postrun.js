module.exports = async ({id, result, config, cli}) => {
  await cli.runHook(`postrun-${id}`, {id, result});
  await cli.runHook('done', {config});
  await cli.runHook(`done-${id}`, {config});
};
