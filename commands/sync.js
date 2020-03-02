const semver = require('semver');

module.exports = async (mono) => {

  // TODO: Move this function to mono.
  const update = (pkg, currentVersion) => {

    if (!pkg) {
      return;
    }

    let isUpdated;

    if (pkg.dependencies || pkg.peerDependencies) {

      for (const [dep, depVersion] of Object.entries({...pkg.dependencies, ...pkg.peerDependencies})) {

        if (!mono.packages[dep]) {
          continue;
        }

        let currentDepVersion = packages[dep] && packages[dep].json && packages[dep].json.version;

        if (!currentDepVersion) {
          continue;
        }

        if (semver.coerce(depVersion).version < currentDepVersion) {

          if (pkg.dependencies && pkg.dependencies[dep]) {
            pkg.dependencies[dep] = `^${currentDepVersion}`;
          }

          if (pkg.peerDependencies && pkg.peerDependencies[dep]) {
            pkg.peerDependencies[dep] = `^${currentDepVersion}`;
          }

          if (pkg.devDependencies && pkg.devDependencies[dep]) {
            pkg.devDependencies[dep] = `^${currentDepVersion}`;
          }

          isUpdated = true;
        }
      }
    }
  
    if (isUpdated && currentVersion === pkg.version) {

      let version = pkg.version.split('.').map(Number);
      version[2] += 1;
      pkg.version = version.join('.');
    }

    if (currentVersion !== pkg.version) {
      mono.packages[pkg.name].updated = true;
    }

    console.log(`${pkg.name}: ${currentVersion} => ${pkg.version}`);

    mono.packages[pkg.name].version = pkg.version;
    mono.savePackageConfig(packages[pkg.name]);
  };

  await mono.checkUnmanaged();
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