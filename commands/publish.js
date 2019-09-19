module.exports = async (mono) => {

  let registry = mono.config.registry && `--registry=${mono.config.registry}` || '';

  let packages = await mono.getAllManagedPackages();
  let resolved = await mono.resolveDependencies(packages);
  let pkg;

  for (const pkgName of resolved) {

    pkg = mono.packages[pkgName];

    if (!pkg.updated) {
      continue;
    }

    let result = mono.executeInPackage(`npm install ${registry} && npm publish ${registry}`, pkg);

    if (result.code === 0) {

      delete mono.packages[pkgName].updated;
      await mono.saveConfig();
    }
  }
};