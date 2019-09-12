module.exports = async (mono) => {

  let registry = mono.config.registry && `--registry=${mono.config.registry}` || '';

  for (const [key, val] of Object.entries(mono.packages)) {

    if (!key || !val) {
      continue;
    }

    if (val.updated) {

      let result = mono.executeInPackage(`npm publish ${registry}`, val);

      if (result.code === 0) {

        delete mono.packages[key].updated;
        await mono.saveConfig();
      }
    }
  }
};