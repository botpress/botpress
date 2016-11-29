## Creating a module

Creating a module for botpress is extremely easy and straightforward. You may choose to create local modules or to publish them back to the community (please!). In either way, the process is exactly the same; so you may choose to create a module for yourself and later publish it.

### Anatomy of a module

To create a module, simply run the following command in an empty directory:

```
botpress create
```

Botpress will ask you a couple of questions and bootstrap the module for you. At this point you should have a new folder with some files in it. All you need to do now is `cd` in the directory and install the local dependencies:

```
npm install
```

**Note: modules are required to start by `botpress-`, otherwise they are ignored and won't be loaded by your bot.** The CLI tool enforces this rule and it should not be changed manually for this reason.

A botpress module looks like so:

```
/src
    index.js
    /views
         index.jsx
         style.scss
package.json
webpack.js
LICENSE
.gitignore
.npmignore
```

As you can see, all the module's logic is inside the `/src` directory. A module has a backend module and a frontend component (/views/index.jsx).

- `webpack.js` bundles your module. Botpress can't load your module if it's not bundled. In most cases, you won't have to deal with webpack or this file directly; everything should work out of the box.

- `package.json` is a regular package.json file, except that is has a mandatory `botpress` configuration entry. You may change the module display name and logo there. Some necessary dependencies have also been installed by default.

- `LICENSE` either AGPL3 or the Botpress License. Defaults to AGPL3.

- `/src/index.js` The module's backend entry point. This is where the module logic goes.

- `/src/views/index.jsx` The module's frontend entry component (written in [React](TODO)). This is where the frontend logic goes.

### Backend



### Frontend

### Compiling

### Testing & Local development

### Publishing