---
id: create
title: Creation
---

## Why should I create a module?

Modules are much more powerful in the latest version of Botpress. And they will have even more fearures in the upcoming one. Almost everything will be based on modules. Our vision is to make it possible to create a module that allows a bot owner to setup his bot from A to Z with little technical knowledge.

Example: You can create a "Restaurant" module, which could be used by a restaurant owner to easily setup his bot. This could include special content types (food items, menu categories, etc), a reservation system, a list of common questions, a way to set opening hours, an example restaurant, etc.

Users will be able to kickstart their projects very quickly !

## Module Structure

This is the basic structure that your module should have:

```bash
module-directory
├── package.json
└── src
    ├── backend
    │   └── index.ts
    └── views
        └── index.jsx
```

There are other optional folders like [`actions`](./actions) or [`build.extras.js`](./build) that are discussed elsewhere.

## Module Entry Point

Your index.ts file must export an [sdk.ModuleEntryPoint](.) object that tells Botpress everything about your module.

We recommend keeping your index.ts file small and split your module's logic in multiple files

We will explore each property below.

```js
const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  onBotMount,
  onBotUnmount,
  config,
  defaultConfigJson,
  serveFile,
  definition: {
    name: 'my-module',
    menuIcon: 'some-icon',
    menuText: '',
    fullName: 'My Module',
    homepage: 'https://botpress.io',
    noInterface: false,
    plugins: []
  }
}

export default entryPoint
```

### onServerStarted

This method is called as soon as the bot is starting up. The server is not available at that time, and calls to other API will fail. This is usually used to set up database connection, which you can access via Knex (`bp.database`). You can [read more about Database access here](./database)

Example:

```js
const onServerStarted = async (bp: SDK) => {
  await db(bp)
}
```

### onServerReady

This is called once all modules are initialized and when the server is listening for incoming connections.

Usually you will setup your [API endpoint](./api-endpoint) here.

Example:

```js
const onServerReady = async (bp: SDK) => {
  await api(bp)
}
```

### onBotMount && onBotUnmount

These methods are called everytime a bot is started or stopped (either when starting Botpress or when creating or deleting a bot).

Example:

```js
const botScopedStorage: Map<string, MyStorage> = new Map<string, MyStorage>()

const onBotMount = async (bp: SDK, botId: string) => {
  const storage = new MyStorage(bp, botId)

  botScopedStorage.set(botId, storage)
}

const onBotUnmount = async (botId: string) => {
  botScopedStorage.delete(botId, storage)
}
```

### config

Module configuration is handled by Botpress so you don't have to deal with configuration panels, validation or fetching/saving data.

Adding new config options is easy. Please refer yourself to the [API Reference]() for possible parameters.

```js
const config: sdk.ModuleConfig = {
  apiKey: { type: 'string', required: true, default: false, env: 'MYMODULE_APIKEY' }
}
```

You can access the bot-specific configuration by calling `bp.config.getModuleConfigForBot(moduleName, botId)`, for example:

```js
const { apiKey } = await bp.config.getModuleConfigForBot('mymodule', botId)
```

### defaultConfigJson

When your module is run for the first time, this configuration will be copied in the configuration file. It will be deprecated in the future, to use the config defined earlier.

### serveFile

Tells Botpress what web bundle to serve to the user when a page is requested. [Read more abour views](./views)

### flowGenerator

When you create new skills, they need a way to generate the custom flow that will be used by the dialog engine. This method should export an object containing the name of the skill and the function to generate it.

```js
const flowGenerator = [
  {
    name: 'choice',
    generator: skill_choice.generateFlow
  }
]
```

### definition

The definition is used by Botpress to setup your module.

Please refer to the [API Reference](.) for informations on the possible options

## Next steps

Now you have created your shiny new module it falls into one of two catagories: bespoke or reuseable.

A bespoke module is one that tackles a problem that is specific to your domain and is unlikely to be useful to others.

A reuseable module, as the name suggests, is a module that domain agnostic and can be used across a number of bots. If you have created a reuseable module and think that it maybe of use to others in the Botpress community, please consider publishing it to the community on our GitHub page.
