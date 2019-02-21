---
id: version-11.5.1-create-module
title: Creating Modules
original_id: create-module
---

<br/>

> ⚠️ Not yet finalized, subject to breaking changes

## Why should I create a module?

Modules are very powerful and have a lot more features than before. They can register new actions, create multiple skills, provide new hooks, and soon they will be able to add new content types and content elements.

Example: You can create a "Restaurant" module, which could be used by a restaurant owner to easily setup his bot. This could include special content types (food items, menu categories, etc), a reservation system, a list of common questions, a way to set opening hours, an example restaurant, etc.

Check out our [existing modules](https://github.com/botpress/botpress/tree/master/modules) to get a better idea of what's possible.

## Module Structure

This is the basic structure that your module should have. Files or folder followed by a question mark are optional and discussed more thoroughly below.

```bash
module-directory
├── build.extras.js?
├── package.json
└── src
    ├── actions?
    ├── backend
    │   └── index.ts
    ├── config.ts?
    └── views
        └── index.jsx
```

## Module Builder

Module creation is now standardized, thanks to a new component called the "Module Builder".

It is the only dependency you have to add in your dev-dependencies. It handles typescript compilation, webpack setup and compilation, packaging for distribution, etc... Here's how to get started:

1. Add the `module-builder` as a dependency:

```js
"devDependencies": {
  "module-builder": "../../build/module-builder"
}
```

1. Add those scripts commands

```js
"scripts": {
  "build": "./node_modules/.bin/module-builder build",
  "watch": "./node_modules/.bin/module-builder watch",
  "package": "./node_modules/.bin/module-builder package"
}
```

Then you can build your module using `yarn build`

### Overriding webpack options

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

### Copying extra files

When you package your modules, only the files in the 'dist' folder are included in the zip, plus production-optimized node_modules.

If you want to add special files to that folder (for example, copy automatically some files not handled by webpack), you need to add a simple file named `build.extras.js` at the root of your module (at the same level as `package.json`).

Your file needs to export an array named `copyFiles` containing the paths to move. It keeps the same folder structure, only changing `src` for `dist`

build.extras.js

```js
module.exports = {
  copyFiles: ['src/backend/somefolder/myfile_*', 'src/backend/binary/*']
}
```

## Module Entry Point

This is where you define how Botpress will interact with your module. Your index.ts file must export an `sdk.ModuleEntryPoint` object. We recommend keeping your index.ts file small and split your module's logic in multiple files. We will explore each property below.

```js
const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onFlowChanged,
  skills,
  botTemplates,
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

This method is called as soon as the bot is starting up. The server is not available at that time, and calls to other API will fail. This is usually used to set up database connection, which you can access via Knex (`bp.database`). You can [read more about Database access here](/docs/create-module#database)

Example:

```js
const onServerStarted = async (bp: SDK) => {
  await db(bp)
}
```

### onServerReady

This is called once all modules are initialized and when the server is listening for incoming connections.

Usually you will setup your [API endpoint](/docs/create-module#api-endpoint) here.

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

### onFlowChanged

This method is called whenever a node is renamed in a flow. This allows you to update your module's data so you are up-to-date with the new changes. For more information on how to implement this metho, please refer yourself to our implementation in the [QNA Module](https://github.com/botpress/botpress/blob/master/modules/qna/src/backend/index.ts)

Example:

```js
const onFlowChanged = async (bp: SDK, botId: string, flow: Flow) => {
  ...
}
```

### skills

When you create new skills, they need a way to generate the custom flow that will be used by the dialog engine. Skills defined here will be displayed in the flow editor in the drop down menu.

```js
const skillsToRegister: sdk.Skill[] = [
  {
    id: 'choice',
    name: 'Choice',
    flowGenerator: choice.generateFlow
  }
]
```

### botTemplates

Templates allows you to create a new bot without starting from scratch. They can include about anything, like content elements, flows, NLU intents, QNAs, etc.

```js
const botTemplates: sdk.BotTemplate[] = [
  {
    id: 'welcome-bot',
    name: 'Welcome Bot',
    desc: 'This is a demonstration bot to showcase some capabilities'
  }
]
```

### definition

The definition is used by Botpress to setup your module.

Please refer to the [API Reference](/reference) for informations on the possible options

The only way to communicate with modules (or between them) is by using the API endpoint.
All modules are isolated and receives their own instance of `bp`

## API Endpoint

The only way to communicate with modules (or between them) is by using the API endpoint.
All modules are isolated and receives their own instance of `bp`

### Consuming API externally or from another module

The Botpress SDK exposes a method to get the axios headers for a request. It will automatically sets the base URL for the request, and will set the required headers to communicate with the specific bot. This method is `bp.http.getAxiosConfigForBot('bot123')`

The method also accepts a second parameter with additional options. Right now, the only available option is `localUrl`. When set to true, the module will communicate with the local url instead of the external one. Ex: `bp.http.getAxiosConfigForBot('bot123', { localUrl: true })`

Once you have this, you simply have to call the axios method of your choice, and add the config as the last parameter. Example:

```js
extractNluContent: async () => {
  const axiosConfig = bp.http.getAxiosConfigForBot(event.botId)
  const text = event.payload.text
  const data = await axios.post(`/mod/nlu/extract`, { text }, axiosConfig)
}
```

### Consuming API from your module's views

When a user is using your module's interface, a bot is already selected so you just need to call `bp.axios`. It is always passed down to your react components as a property.

```JS
const result = await this.props.bp.axios.get('/mod/my-modyle/query')
```

### Creating an API endpoint

Modules are global, as is the API, so they must be able to manage multiple bots. We recommend setting up the API route in the `onServerReady` method of your entry point.

The bot ID targeted by the request is always available via `req.params.botId`

Setting up an API is very easy.

```js
const router = bp.http.createRouterForBot('dialog-sessions')

router.get('/count', async (req, res) => {
  const botId = req.params.botId

  const { dialogSessions } = await knex('dialog_sessions')
    .count('id as dialogSessions')
    .where({ botId })
    .first()

  res.send({ dialogSessions })
})
```

In the example above, we added a route handler that will be available via `/mod/dialog-sessions/count` which fetches data from the database and returns the data as json.

## Configuration

Module configuration is handled automatically by Botpress (saving and loading). All you need to do is add a file named `config.ts` in your bot `src` folder. This file should be written in typescript (so your variables are correctly typed).

Since an example is worth a thousand words, check out [existing modules configuration files](https://github.com/botpress/botpress/tree/master/modules) to get a better idea.

## Database

Botpress officially supports two databases: SQLite or Postgres. Your module can access the bot's database to create and update required tables.

### Initialization and Table creation

Tables initialization should be done in the `onServerStarted` block of your `src/backend/index.ts` file.

index.ts

```js
import Database from './db'

let db = undefined

const onServerStarted = async (bp: SDK) => {
  db = new Database(bp)
  await db.initialize()
}
```

db.ts

```js
export default class Database {
  knex: any

  constructor(private bp: SDK) {
    this.knex = bp.database
  }

  initialize() {
    if (!this.knex) {
      throw new Error('You must initialize the database before')
    }

    this.knex.createTableIfNotExists('my_module_db', ...)
  }
}
```

### Migration

Database migration isn't available at the moment, it should be added in a future iteration

### Knex extension

We extended Knex functionality with common features that makes development easier, by handling internally differences between different databases. When accessing `bp.database`, you have access to all the usual Knex commands, plus the following ones

#### Check if using SQlite

The method `bp.database.isLite` returns true if the database is SQLite

#### Table creation

Here is a simple example to create your module's table if it is missing:

Usage: `bp.database.createTableIfNotExists(table_name, data_callback)`

```js
bp.database
  .createTableIfNotExists('my_module_table', function(table) {
    table.increments('id').primary()
    table.string('type')
    table.string('text', 640)
    table.jsonb('raw_message')
    table.timestamp('ts')
  })
  .then(async () => {
    // You may chain table creation
  })
```

#### Insert and retrieve

Inserts the row in the database and returns the inserted row

If you omit returnColumn or idColumn, it will use `id` as the default.

Usage: `bp.database.insertAndRetrieve(table_name, data, returnColumn?, idColumn?)`

```js
const someObject = (await bp.database.insertAndRetrieve)(
  'my_module_table',
  {
    botId: session.botId,
    important_data: bp.database.json.set(data || {}),
    created_on: bp.database.date.now()
  },
  ['botId', 'important_data', 'created_on']
)
```

#### Date helper

## Views

The main view of the module is found in the `src/views/index.jsx` file by default.

By modifying this view, you can fetch the data from your new endpoint and present it to the user:

```jsx
export default class TemplateModule extends React.Component {
  state = { dialogSessions: 0 }

  componentDidMount() {
    fetch('/mod/dialog-sessions/count')
      .then(res => res.json())
      .then(({ dialogSessions }) => this.setState({ dialogSessions }))
  }

  render() {
    const { dialogSessions } = this.state
    return <h4>{`Currently there are ${dialogSessions} dialog sessions in DB`}</h4>
  }
}
```

It is also possible to expose multiple views. Those new variations needs to be specified in your `package.json` file under the object `botpress.liteViews`. They will be available at `/assets/modules/$YOUR_MODULE/web/$VIEW_NAME.bundle.js`

Let's say you want to provide a fullscreen version of your module:

package.json

```js
"botpress": {
  "liteViews": {
    "fullscreen": "./src/views/web/fullscreen.jsx"
  }
}
```

## Skill Creation

There are a couple of steps required to create a new skill. Basically, a skill consist of a GUI to input values and a flow generator to create the interactions.

### Creating the GUI

The first step is to create the GUI that will be displayed to the user. Create a `.jsx` file with the name

```jsx
import React from 'react'

export default class TemplateModule extends React.Component {
  render() {
    return null
  }
}
```

### Preparing the GUI bundle

Once your `.jsx` file is ready, we need to tell Botpress what bundle it should create, and how to serve it.

Open the file `package.json` of your module, and add this snippet of code. Change the variables with the values from your particular case. You can add any number of skills.

```js
"botpress": {
    "liteViews": {
      "$ID_OF_SKILL": "./src/views/$ID_OF_SKILL.jsx",
      "$ID_OF_SKILL2": "./src/views/$ID_OF_SKILL2.jsx"
    }
  },
```

This tells the `module-builder` to create a bundle with your interface. The bundles will be available at `/assets/modules/$YOUR_MODULE/web/$ID_OF_SKILL.bundle.js`

### Creating the flow generator

The flow generator will create all the transitions and conditions based on the data that was feeded by the GUI. That method will be called by the Studio when the user has finished inputting all his data. Your method will receive a `data` object. and must return a partial flow.

Example:

```js
const generateFlow = (data): sdk.FlowGenerationResult => {
  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [],
      next: [{ condition: 'true', node: '...' }]
    }
  ]

  return {
    transitions: createTransitions(data),
    flow: {
      nodes: nodes,
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = data => {
  const transitions: sdk.NodeTransition[] = []
  return transitions
}

export default { generateFlow }
```

### Connecting all those

All the required parts are done, the only thing left is to register the skills. Provide an array of your skills in the same variable in the module entry point.

Example:

```js
const skillsToRegister: sdk.Skill[] = [
  {
    id: '$ID_OF_SKILL',
    name: '$DISPLAYED_NAME',
    flowGenerator: generateFlow
  }
]
```

```js
const entryPoint: sdk.ModuleEntryPoint = {
  ...,
  skills: skillsToRegister
}
```

## Register Actions

Modules can register new actions that will be available on the flow editor. Please check out the [Custom Code](../build/code) section for more informations about Actions.
Those actions must be deployed to the `data/global/actions` folder to be recognized by Botpress. Here is how to do that:

1. Create a folder named `actions` in `src`
1. Add your javascript files in the folder
1. When you build your module, your files will be copied in the `dist` folder
1. At every startup, action files are copied in `data/global/actions/$MY_MODULE/`

They are then accessible by the name `$MY_MODULE/$MY_ACTION` in any node or skill

If your action requires external dependencies, you must add them on your module's `package.json` as dependencies. When the VM is initialized, we redirect `require` requests to the node_modules of its parent module.

> Many dependencies are already included with Botpress and do not need to be added to your package (ex: lodash, axios, etc... )
