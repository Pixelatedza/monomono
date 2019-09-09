module.exports = async (mono, options) => {

  if (!options[0]) {

    console.log('No package directory specified.');
    return;
  }

  let pkg = {};

  try {
    pkg = await mono.getPackageInfo(options[0]);
  } catch (e) {
    console.log(e);
  }

  if (mono.packages[pkg.json.name]) {

    console.log('package already managed by mono.');
    return;
  }

  mono.addPackage(pkg);
};