#!/usr/bin/env node
const fs = require('fs');
const util = require('util');
const path = require('path');
const shell = require('shelljs');
const commands = require('../commands');

// This is to support node 8 and up.
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);

class Mono{

  constructor (config) {

    this.config = {
      packageDir: config.packageDir || 'packages',
      componentDir: config.components || 'components',
      packages: config.packages || {},
      strictMode: config.strictMode !== false,
      registry: config.registry || undefined,
    };

    this.baseDir = process.cwd();
    this.packageDir = path.join(this.baseDir, this.config.packageDir);
    this.componentDir = path.join(this.baseDir, this.config.componentDir);
    this.packages = this.config.packages;
    this.resolvedPackages = [];
  }

  static async run(command, args, config = {}) {

    let flags = [];
    let options = [];

    for (const val of args) {

      if (val[0] === '-' || val[0] === '--') {
        flags.push(val);
        continue;
      }

      options.push(val);
    }

    try {

      let mono = new Mono(config);
      commands[command](mono, options, flags);
    } catch (e) {
      console.log(e);
    }
  }

  saveConfig() {

    return writeFile(
      path.join(this.baseDir, 'mono.json'),
      JSON.stringify(this.config, null, 2) + '\n'
    );
  }

  savePackageConfig(pkg) {

    let pkgConfig = path.join(this.packageDir, pkg.directory, 'package.json');

    return writeFile(
      pkgConfig,
      JSON.stringify(pkg.json, null, 2) + '\n'
    );
  }

  addPackage(pkg) {

    this.config.packages[pkg.json.name] = {
      version: pkg.version,
      directory: pkg.directory,
    };

    this.saveConfig();
  }

  removePackage(pkg) {

    delete this.config.packages[pkg.json.name];
    this.saveConfig();

    // I would like to delete the directory, but this method feels dangerous.
    // shell.rm('-rf', path.join(this.packageDir, pkg.directory));
  }

  getPackageInfo(pkg) {

    let pkgConfig = path.join(this.packageDir, pkg, 'package.json');

    return readFile(pkgConfig)
      .then(data => {

        let json = JSON.parse(data.toString());

        return {
          json: json,
          version: this.packages[json.name] && this.packages[json.name].version || json.version,
          directory: pkg,
        }
      })
      .catch(e => {console.log(e)});
  }

  async getAllPackages(packageDirectories) {

    let promises = [];
    let packages = {};

    for (const pkgDir of packageDirectories) {
      
      let promise = this.getPackageInfo(pkgDir);
      promises.push(promise);
      promise.then(pkg => {
        packages[pkg.json.name] = pkg;
      });
    }

    await Promise.all(promises);
    return packages;
  }

  async getAllManagedPackages() {

    let directories = [];

    for (const pkg of Object.values(this.packages)) {
      directories.push(pkg.directory);
    }

    return this.getAllPackages(directories);
  }

  async getAllDirectoryPackages() {

    let directories = await readdir(this.packageDir);
    return this.getAllPackages(directories);
  }

  checkUnmanaged() {

    return readdir(this.packageDir)
      .then(files => {

        let promises = [];

        for (const pkgDir of files) {

          promises.push(
            this
              .getPackageInfo(pkgDir)
              .then(pkg => {
                
                if (!pkg) {
                  return;
                }

                let name = pkg.json && pkg.json.name;

                if (!name) {
                  console.log(`Found package with no name: ${pkg.directory}`);
                }

                if (!this.packages[name]) {
                  
                  if (this.config.strictMode) {
                    console.log(`Found unmanaged package: ${name}`)
                    process.exitCode = 1;
                    throw Error;
                  }

                  console.log(`Found unmanaged package: ${name}`);
                }
              })
          );
        }

        return Promise.all(promises);
      })
  }

  resolveDependencies(packages) {

    for (const pkg of Object.values(packages)) {

      this.resolvePackage(
        pkg.json,
        packages,
        []
      );
    }

    return this.resolvedPackages;
  }

  resolvePackage(
    pkg,
    packages,
    seen
  ) {

    if (!pkg) {
      return;
    }

    if (this.resolvedPackages.includes(pkg.name)) {
      return;
    }

    if (!pkg.dependencies){

      this.resolvedPackages.push(pkg.name);
      return;
    }

    seen.push(pkg.name);

    for (const dep of Object.keys(pkg.dependencies)) {

      if (this.resolvedPackages.includes(dep)) {
        continue;
      }

      if (seen.includes(dep)) {

        console.error(`circular reference detected: ${pkg.name} --> ${dep}`);
        process.exitCode = 1;
        throw Error;
      }

      if (!this.packages[dep]) {

        console.log(`package ${dep} does not exist in mono repo`);
        continue;
      }

      this.resolvePackage(
        packages[dep].json,
        packages,
        seen
      );
    }

    this.resolvedPackages.push(pkg.name);
  }

  executeInPackage(command, pkg) {

    shell.cd(this.packageDir);
    shell.cd(pkg.directory);

    console.log(`\n## Running command in ${pkg.directory}`);
    let shellResult = shell.exec(command);

    if (shellResult.code !== 0) {
      process.exitCode = shellResult.code;
    };

    return shellResult;
  }

  executeInPackages(command, packages) {

    shell.cd(this.packageDir);

    packages = packages || this.packages;

    for (const pkg of Object.values(packages)) {

      shell.cd(pkg.directory);

      console.log(`\n## Running command in ${pkg.directory}`);
      let shellResult = shell.exec(command);

      if (shellResult.code !== 0) {

        process.exitCode = shellResult.code;
        return;
      };

      shell.cd('..');
    }
  }
}

  readFile(path.join(process.cwd(), 'mono.json'))
  .then(data => {

    return Mono.run(
      process.argv[2] || 'help',
      process.argv.slice(3),
      JSON.parse(data.toString()),
    );
  })
  .catch(e => {

    if (process.argv[2] === 'init'){

      return Mono.run(
        process.argv[2] || 'help',
        process.argv.slice(3),
      );
    }

    console.log('No mono.json file found. Please run mono init or create the file yourself.');
  });
