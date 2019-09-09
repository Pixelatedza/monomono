module.exports = (mono) => {

  let registry = mono.config.registry && ` --registry=${mono.config.registry}` || '';
  mono.executeInPackages(`npm publish ${registry}`);
};