# Monomono

Monomono is a multi-package manager for nodejs projects.

Currently the project only supports nodejs projects in a mono-repo format.

The goal is to make it as extensible and customizable as possible to work for any project setup or environement.

## Setup

Install package.

```npm install monomono```

Add script to package.json
```
"scripts": {
  "mono": "mono"
}
```

## Usage

### init
Will initialize a default mono.json config file and track all packages in the ./packages directory.
```
npm run mono init
```

### sync
This will sync all version numbers in managed packages. If package two realies on package one and you update package one, this will update packages two's dependencies and automatically bump the version as a patch. This will be done for the entire dependency tree.
```
npm run mono sync
``` 

### add
Tells mono to add a package to the managed packages list.
```
npm run mono add <directory>
```

### remove
Removes a package from the managed packages list.
```
npm run mono remove <directory>
```

### publish
Currently this is a node specific command. It will execute ```npm publish``` in all managed packages.
```
npm run mono publish
```

### exec
Executes the given command line string in all managed packages.
```
npm run mono exec '<my command>'
```
