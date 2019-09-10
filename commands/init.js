module.exports = async (mono) => {

  let packages = await mono.getAllDirectoryPackages();

  for (const pkg of Object.values(packages)) {

    let name = pkg.json && pkg.json.name;

    if (!name) {

      console.log(`Found package with no name: ${pkg.directory}`);
      continue;
    }

    if (mono.packages[name]) {

      console.log(`Skipped: ${name} package already managed by mono.`);
      continue;
    }

    mono.addPackage(pkg);
  }
};