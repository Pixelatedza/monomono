const semver = require('semver');

module.exports = async (mono) => {

  // TODO: Move this function to mono.
  const update = (pkg, currentVersion) => {

    if (!pkg) {
      return;
    }

    let isUpdated;

    if (pkg.dependencies) {

      for (const [dep, depVersion] of Object.entries(pkg.dependencies)) {
  
        if (!mono.packages[dep]) {
          continue;
        }

        let currentDepVersion = packages[dep] && packages[dep].json && packages[dep].json.version;

        if (!currentDepVersion) {
          continue;
        }

        if (semver.coerce(depVersion).version < currentDepVersion) {
    
          pkg.dependencies[dep] = `^${currentDepVersion}`;
          isUpdated = true;
        }
      }
    }
  
    if (isUpdated && currentVersion === pkg.version) {
  
      let version = pkg.version.split('.').map(Number);
      version[2] += 1;
      pkg.version = version.join('.');
    }

    console.log(`${pkg.name}: ${currentVersion} => ${pkg.version}`);

    mono.packages[pkg.name].version = pkg.version;
    mono.savePackageConfig(packages[pkg.name]);
  };

  try {
    await mono.checkUnmanaged();
  } catch (e) {
    
    console.log(e.message);
    return;
  }

  let packages = await mono.getAllManagedPackages();
  let resolved = await mono.resolveDependencies(packages);

  console.log('\n## Updating packages ##')
  for (const pkgName of resolved) {

    let pkg = packages[pkgName];
    let json = pkg.json;
    let currentVersion = mono.packages[pkgName].version;
    update(json, currentVersion);
  }

  mono.saveConfig();
  return;
};