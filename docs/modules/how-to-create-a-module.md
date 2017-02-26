## How to create a module

Creating a module for botpress is extremely easy and straightforward. You may choose to create local modules or to publish them back to the community (please!). Either way, the process is exactly the same; so you may choose to create a module for yourself and publish it later.

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

- `/src/views/index.jsx` The module's frontend entry component (written in [React](https://facebook.github.io/react/)). This is where the frontend logic goes.

### Backend

A module entry point is an object that exposes two methods: `init` and `ready`.

Both methods take **`bp`** as their first argument and do not need to return anything.

- `init(bp)` is called on module initialization (before the bot is started). Middlewares registration usually goes here.
- `ready(bp)` is called once all modules are loaded and the bot is fully started. Routing and module logic usually go here.

To see more examples of how modules are implemented, you may look at the source of existing modules such as [`botpress-messenger`](https://github.com/botpress/botpress-messenger/blob/master/src/views/index.jsx).

### Frontend

The front-end of a module is a [React Component](https://facebook.github.io/react/docs/react-component.html). All you have to do is import React and export a React.Component class in `/src/views/index.jsx`.

Botpress will pass an instance of the front-end `bp` instance and a pre-configured `axios` to your module component:

- `bp` exposes `bp.events`, which is an instance of the [EventBus](events.md)
- [`axios`](https://github.com/mzabriskie/axios) is pre-configured to provide the required authentication token by the API routes

#### Example

```js
import React from 'react'

export default class TemplateModule extends React.Component {

  emitEvent() {
    this.props.bp.events.emit('test.clicked', { a: '123' })
  }

  render() {
    return <button onClick={::this.emitEvent}>Click me</button>
  }
}
```

To see more examples of how modules are implemented, you may look at the source of existing modules such as [`botpress-messenger`](https://github.com/botpress/botpress-messenger/blob/master/src/views/index.jsx).

### Bundling

**Note: modules code are transpiled by default with the `react`, `stage-0` and `latest` [Babel](http://babeljs.io) presets. For more details, please have a look at the `webpack.js` file in your module's root.**

In order for the module to be loaded by botpress, it needs to be bundled into two files:

- **`bin/node.bundle.js`**
- **`bin/web.bundle.js`**

In order to do that, your module's `package.json` includes two commands:

- `npm run compile`: bundles the module
- `npm run watch`: continuous bundling, waiting for changes

### Testing & Local development

You can install a module you are currently developing as follows:

```
botpress install ../path/to/my/module
```

Then you can use the [`npm link`](https://docs.npmjs.com/cli/link) command to link the module with a symbolic link (instead of having to re-install it at every change):

```
npm link ../path/to/my/botpress-module
```

### Publishing

To publish your module:

```
npm publish
```

Botpress crawls and indexes modules periodically. It may take up to 45 minutes before your module shows up in the list of available modules. Even before it shows up, it is available to install via the [`botpress install`](cli-reference.md#install--i) command.

Note that the **all of the following criteria must be met** before a module can appear as a community module:

1. You must have filled and signed the **Distribution Agreement** _(available soon)_. The agreement shows up automatically before running `npm publish`.
2. The module name must start with `botpress-`
3. The license must be set to `AGPL 3.0` or `Botpress License`
4. The `package.json` must have a valid `botpress` section
5. The code of the module must be hosted on GitHub, be public and the `repository` field in your `package.json` must point to it

If you have done all of the above and are still having problems, please [contact us](https://slack.botpress.io) and we will aim to quickly resolve the issue for you.
