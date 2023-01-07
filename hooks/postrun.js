module.exports = async ({id, result, config}) => {
  await config.runHook('before-end', {id, result});
  await config.runHook('cli-after', {id, result});
  await config.runHook(`cli-${id}-after`, {id, result});
  await config.runHook('cache-rebuild', {id, result});
};
