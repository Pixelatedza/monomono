module.exports = async (mono, options, flags) => {

  if (!options[0]) {

    console.log('No command specified.');
    process.exitCode = 1;
    return;
  }

  let registry = mono.config.registry && `--registry=${mono.config.registry}` || '';

  // execute only in updated packages
  if (flags['-u'] || flags['--updated']) {

    let packages = await mono.getAllManagedPackages();
    let resolved = await mono.resolveDependencies(packages);
    let pkg;
  
    for (const pkgName of resolved) {
  
      pkg = mono.packages[pkgName];
  
      if (!pkg.updated) {
        continue;
      }
  
      let result = mono.executeInPackage(options[0], pkg);
  
      if (result.code === 0) {
  
        delete mono.packages[pkgName].updated;
        await mono.saveConfig();
      }
    }

    return;
  }

  mono.executeInPackages(options[0]);
};