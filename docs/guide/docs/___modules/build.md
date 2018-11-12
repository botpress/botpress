---
id: build
title: Building
---

Module creation is now standardized, thanks to a new component called the "Module Builder".

It is the only dependency you have to add in your dev-dependencies. It handles typescript compilation, webpack setup and compilation, packaging for distribution, etc...

## Setting up the module-builder

There's 2 simple steps to get started with the tool:

1. Add the `module-builder` as a dependency:

```js
"devDependencies": {
  "module-builder": "../../build/module-builder"
}
```

1. Add the script commands

```js
"scripts": {
  "build": "./node_modules/.bin/module-builder build",
  "watch": "./node_modules/.bin/module-builder watch",
  "package": "./node_modules/.bin/module-builder package"
}
```

Thats it !

## Overriding webpack options

It is possible to override webpack parameters by adding a "webpack" property to the `package.json` file of your module. When you override a property, you also remove the default settings that we've set, so we recommend adding them back when overriding. For example, if you'd like to add an additional external file:

```js
"webpack": {
  "externals": {
    //These 3 are included by default
    "react": "React",
    "react-dom": "ReactDOM",
    "react-bootstrap": "ReactBootstrap",

    //Your new addition:
    "botpress/content-picker": "BotpressContentPicker"
  }
}
```

## Copying extra files

When you package your modules, only the files in the 'dist' folder are included in the zip, plus production-optimized node_modules.

If you want to add special files to that folder (for example, copy automatically some files not handled by webpack), you need to add a simple file named `build.extras.js` at the root of your module (at the same level as `package.json`).

Your file needs to export an array named `copyFiles` containing the paths to move. It keeps the same folder structure, only changing `src` for `dist`

build.extras.js

```js
module.exports = {
  copyFiles: ['src/backend/somefolder/myfile_*', 'src/backend/binary/*']
}
```
