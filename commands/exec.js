module.exports = async (mono, options, flags) => {

  if (!options[0]) {

    console.log('No command specified.');
    process.exitCode = 1;
    return;
  }

  mono.executeInPackages(options[0]);
};