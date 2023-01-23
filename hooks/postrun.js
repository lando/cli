module.exports = async ({id, result, cli}) => {
  await cli.runHook('before-end', {id, result});
  await cli.runHook('cli-after', {id, result});
  await cli.runHook(`cli-${id}-after`, {id, result});
  await cli.runHook('cache-rebuild', {id, result});
};
