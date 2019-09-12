module.exports = (mono) => {
  mono.executeInPackages(`rm -rf node_modules`);
};