#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const shell = require('shelljs');
const MonoConfig = require('./mono.json');
const commands = require('./commands');

class Mono{

  constructor () {

    this.config = {
      packageDir: MonoConfig.packageDir || 'packages',
      componentDir: MonoConfig.components || 'components',
      packages: MonoConfig.packages || {},
      strictMode: !MonoConfig.strictMode ? MonoConfig.strictMode : true,
      registry: MonoConfig.registry || null,
    };

    this.baseDir = process.cwd();
    this.packageDir = path.join(this.baseDir, this.config.packageDir);
    this.componentDir = path.join(this.baseDir, this.config.componentDir);
    this.packages = this.config.packages;
    this.resolvedPackages = [];
  }

  static async run(command, args) {

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

      let mono = new Mono();
      commands[command](mono, options, flags);
    } catch (e) {
      console.log(e);
    }
  }

  addPackage(pkg) {

    this.config.packages[pkg.json.name] = {
      version: pkg.version,
      directory: pkg.directory,
    };

    fs.writeFile(
      'mono.json',
      JSON.stringify(this.config, null, 2)
    );
  }

  removePackage(pkg) {

    delete this.config.packages[pkg.json.name];

    fs.writeFile(
      'mono.json',
      JSON.stringify(this.config, null, 2)
    );

    // I would like to delete the directory, but this feels dangerous.
    // shell.rm('-rf', path.join(this.packageDir, pkg.directory));
  }

  getPackageInfo(pkg) {

    let pkgConfig = path.join(this.packageDir, pkg, 'package.json');

    return fs
      .readFile(pkgConfig)
      .then(data => {

        let json = JSON.parse(data.toString());

        return {
          json: json,
          version: json.version,
          directory: pkg,
        }
      })
      .catch(e => {console.log(e)});
  }

  getAllPackages() {

    return fs.readdir(this.packageDir)
      .then(files => {

        let pkg;
        let packages = [];

        for (let i = 0; i < files.length; i++) {

          pkg = files[i];

          if (!pkg) {
            continue;
          }

          packages.push(

            fs
              .readFile(path.join(
                this.packageDir,
                pkg,
                'package.json'
              ))
              .then(data => {

                let json = JSON.parse(data.toString());

                if (!this.packages[json.name]) {

                  if (this.config.strictMode) {
                    throw new Error(`Found unmanaged package: ${json.name}`);
                  }

                  console.log(`Found unmanaged package: ${json.name}`);

                  this.packages[json.name] = {
                    currentVersion: json.version,
                  };
                }

                this.packages[json.name].json = json;
                return this.packages;
              })
          );

        }

        return Promise.all(packages);
      })
  }

  resolveDependencies() {

    for (const pkg of Object.values(this.packages)) {

      this.resolvePackage(
        pkg.json,
        []
      );
    }
  }

  resolvePackage(
    pkg,
    seen
  ) {

    if (!pkg) {
      return;
    }

    if (this.resolvedPackages.includes(pkg.name)) {
      return;
    }

    seen.push(pkg.name);

    for (const dep of Object.keys(pkg.dependencies)) {

      if (this.resolvedPackages.includes(dep)) {
        continue;
      }

      if (seen.includes(dep)) {

        console.error(`circular reference detected: ${pkg.name} --> ${dep}`);
        throw new Error('circular dependency');
      }

      if (!this.packages[dep]) {

        console.log(`package ${dep} does not exist in project`);
        continue;
      }

      this.resolvePackage(
        this.packages[dep].json,
        seen
      );
    }

    this.resolvedPackages.push(pkg.name);
  }

  executeInPackages(command) {

    shell.cd(this.packageDir);

    for (const pkg of Object.values(this.packages)) {
      shell.cd(pkg.directory);
      shell.exec(command);
      shell.cd('..');
    }
  }
}

Mono.run(
  process.argv[2] || 'help',
  process.argv.slice(3)
);
