module.exports = async (mono) => {

  const update = (pkg, currentVersion) => {

    if (!pkg) {
      return;
    }
  
    let isUpdated;
  
    for (const [dep, depVersion] of Object.entries(pkg.dependencies)) {

      if (!mono.packages[dep]) {
        continue;
      }

      if (depVersion < mono.packages[dep].json.version) {
  
        pkg.dependencies[dep] = mono.packages[dep].json.version;
        isUpdated = true;
      }
    }
  
    if (isUpdated && currentVersion === pkg.version) {
  
      let version = pkg.version.split('.').map(Number);
      version[2] += 1;
      pkg.version = version.join('.');
    }
  
    mono.packages[pkg.name].currentVersion = pkg.version;
  };

  await mono.getAllPackages();
  await mono.resolveDependencies();

  for (const pkgName of mono.resolvedPackages) {

    let pkg = mono.packages[pkgName];
    let json = pkg.json;
    let currentVersion = pkg.currentVersion;
    update(json, currentVersion);
  }

  return;
};