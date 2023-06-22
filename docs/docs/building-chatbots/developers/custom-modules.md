---
id: custom-modules
title: Custom Modules
---

---

## Module Templates

To help you get started, two templates are available: [Module Templates](https://github.com/botpress/v12/tree/master/examples/module-templates).

1. Copy the template of your choice.
1. Paste it in `modules/`.
1. In your `botpress.config.json`, enable the module.

## Module Structure

This is the basic structure that your module should have. Files or folders followed by a question mark are optional and discussed more thoroughly below.

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

It's the only dependency you have to add in your dev-dependencies. It handles typescript compilation, webpack setup and compilation, packaging for distribution, etc... Here's how to get started:

1. Add the `module-builder` as a dependency:

```js
"devDependencies": {
  "module-builder": "../../build/module-builder"
}
```

2. Add those scripts commands:

```js
"scripts": {
  "build": "./node_modules/.bin/module-builder build",
  "watch": "./node_modules/.bin/module-builder watch",
  "package": "./node_modules/.bin/module-builder package"
}
```

Then you can build your module using `yarn build`.

## Local Development Tips

In order to have code changes automatically recompiled, you need to first run `yarn cmd dev:modules` (run `yarn cmd default` to get full documentation for other useful commands). Restart server to apply backend changes and refresh your browser for UI changes.

Then, you can type `cd modules/your-module` and start a `yarn watch` process in another terminal. This will process will recompile your module's code.

To regenerate the `config.schema.json` file for your module, you need to run `yarn build` from the module directory.

Once your module is ready to be deployed, from your module's directory, run `yarn build && yarn package`. This will generate a `.tgz` archive containing your compiled module.

### Overriding Webpack Options

It is possible to override webpack parameters by adding a "webpack" property to the `package.json` file of your module. When you override a property, you also remove the default settings that we've set, so we recommend adding them back when overriding. For example, if you want to add an additional external file:

**Example:**

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

### Copying Extra Files

When you package your modules, only the files in the `dist` folder are included in the zip, plus production-optimized `node_modules`.

If you want to add special files to that folder (for example, copy automatically some files not handled by webpack), you need to add a simple file named `build.extras.js` at the root of your module (at the same level as `package.json`).

Your file needs to export an array named `copyFiles` containing the paths to move. It keeps the same folder structure, only changing `src` for `dist`.

**Example:**

`build.extras.js`

```js
module.exports = {
  copyFiles: ["src/backend/somefolder/myfile_*", "src/backend/binary/*"]
}
```

## Module Entry Point

This is where you define how Botpress will interact with your module. Your `index.ts` file must export an `sdk.ModuleEntryPoint` object.

:::tip
Keep your `index.ts` file small and split your module's logic in multiple files.
:::

We will explore each property below.

**Example:**

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
    name: "my-module",
    menuIcon: "some-icon",
    menuText: "",
    fullName: "My Module",
    homepage: "https://botpress.com",
    noInterface: false,
    plugins: []
  }
}

export default entryPoint
```

### onServerStarted

This method is called as soon as the bot is starting up. The server is not available at that time, and calls to other API will fail. This is usually used to set up database connection, which you can access via Knex (`bp.database`).

**Example:**

```js
const onServerStarted = async (bp: SDK) => {
  await db(bp)
}
```

### onServerReady

This is called once all modules are initialized and when the server is listening for incoming connections.

Usually you will setup your [API endpoint](#api-endpoint) here.

**Example:**

```js
const onServerReady = async (bp: SDK) => {
  await api(bp)
}
```

### onBotMount && onBotUnmount

These methods are called every time a bot is started or stopped (either when starting Botpress or when creating or deleting a bot).

**Example:**

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

This method is called whenever a node is renamed in a flow. This allows you to update your module's data so you are up-to-date with the new changes. For more information on how to implement this method, please refer yourself to our implementation in the [QNA Module](https://github.com/botpress/v12/blob/master/modules/qna/src/backend/index.ts)

**Example:**

```js
const onFlowChanged = async (bp: SDK, botId: string, flow: Flow) => {
  ...
}
```

### skills

When you create new skills, they need a way to generate the custom flow that will be used by the dialog engine. Skills defined here will be displayed in the flow editor in the dropdown menu.

**Example:**

```js
const skillsToRegister: sdk.Skill[] = [
  {
    id: "Choice", // This must be the name of the component exported in your module full view
    name: "Choice", // This is the value displayed to the user
    flowGenerator: choice.generateFlow
  }
]
```

### botTemplates

Templates allow you to create a new bot without starting from scratch. They can include about anything, like content elements, flows, NLU intents, QNAs, etc.

**Example:**

```js
const botTemplates: sdk.BotTemplate[] = [
  {
    id: "welcome-bot",
    name: "Welcome Bot",
    desc: "This is a demonstration bot to showcase some capabilities"
  }
]
```

### Definition

The definition is used by Botpress to setup your module.

Please refer to the [SDK Reference](https://botpress.com/reference/) for information on the possible options.

The only way to communicate with modules (or between them) is by using the API endpoint.

All modules are isolated and receive their own instance of `bp`.

## API Endpoint

The only way to communicate with modules (or between them) is by using the API endpoint.

All modules are isolated and receive their own instance of `bp`.

### Consuming API Externally or From Another Module

The Botpress SDK exposes a method to get the axios headers for a request. It will automatically set the base URL for the request and the required headers to communicate with the specific bot. This method is `bp.http.getAxiosConfigForBot('bot123'): Promise<AxiosRequestConfig>`.

The method also accepts a second parameter with additional options. Right now, the only available option is `localUrl`. When set to true, the module will communicate with the local URL instead of the external one.

**Example:**

`bp.http.getAxiosConfigForBot('bot123', { localUrl: true })`

Once you have this, you simply have to call the axios method of your choice, and add the config as the last parameter.

**Example:**

```js
extractNluContent: async () => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  const text = event.payload.text
  const data = await axios.post(`/mod/nlu/extract`, { text }, axiosConfig)
}
```

### Consuming API From Your Module's Views

When a user is using your module's interface, a bot is already selected so you just need to call `bp.axios`. It is always passed down to your react components as a property.

**Example:**

```JS
const result = await this.props.bp.axios.get('/mod/my-module/query')
```

### Creating an API Endpoint

Modules are global, as is the API, so they must be able to manage multiple bots.

:::tip
Set up the API route in the `onServerReady` method of your entry point.
:::

The bot ID targeted by the request is always available via `req.params.botId`.

Setting up an API is very easy:

```js
const router = bp.http.createRouterForBot("dialog-sessions")

router.get("/count", async (req, res) => {
  const botId = req.params.botId

  const { dialogSessions } = await knex("dialog_sessions")
    .count("id as dialogSessions")
    .where({ botId })
    .first()

  res.send({ dialogSessions })
})
```

In the example above, we added a route handler that will be available via `/mod/dialog-sessions/count` which fetches data from the database and returns the data as json.

## Configuration

Module configuration is handled automatically by Botpress (saving and loading). All you need to do is add a file named `config.ts` in your bot `src` folder. This file should be written in typescript (so your variables are correctly typed).

Since an example is worth a thousand words, check out [existing modules configuration files](https://github.com/botpress/v12/tree/master/modules) to get a better idea.

## Database

Botpress officially supports two databases: SQLite or Postgres. Your module can access the bot's database to create and update required tables.

### Initialization and Table creation

Tables initialization should be done in the `onServerStarted` block of your `src/backend/index.ts` file.

`index.ts`

```js
import Database from "./db"

let db = undefined

const onServerStarted = async (bp: SDK) => {
  db = new Database(bp)
  await db.initialize()
}
```

`db.ts`

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

Database migration isn't available at the moment, it should be added in a future iteration.

### Knex Extension

We extended Knex functionality with common features that makes development easier, by handling internally differences between different databases. When accessing `bp.database`, you have access to all the usual Knex commands, plus the following ones:

#### Check if Using SQlite

The method `bp.database.isLite` returns true if the database is SQLite.

#### Table Creation

Here is a simple example to create your module's table if it is missing:

Usage: `bp.database.createTableIfNotExists(table_name, data_callback)`

```js
bp.database
  .createTableIfNotExists("my_module_table", function(table) {
    table.increments("id").primary()
    table.string("type")
    table.string("text", 640)
    table.jsonb("raw_message")
    table.timestamp("ts")
  })
  .then(async () => {
    // You may chain table creation
  })
```

#### Insert and Retrieve

Inserts the row in the database and returns the inserted row.

If you omit `returnColumn` or `idColumn`, it will use `id` as the default.

Usage: `bp.database.insertAndRetrieve(table_name, data, returnColumn?, idColumn?)`

```js
const someObject = (await bp.database.insertAndRetrieve)(
  "my_module_table",
  {
    botId: session.botId,
    important_data: bp.database.json.set(data || {}),
    created_on: bp.database.date.now()
  },
  ["botId", "important_data", "created_on"]
)
```

#### Date Helper

## Views

There are two different type of views (or bundles) that your module can offer. A view can consist of multiple components. These components can be used by other modules, and your own module can also consume components of other modules.

Check out the [Complete Module Example on GitHub](https://github.com/botpress/v12/tree/master/examples) for more details on how you can implement views.

### Full View

This view includes heavy dependencies, like `react-bootstrap`. When you want to add an interface for your module, your full view need to export a `default` component.
The main view of the module is found in the `src/views/full/index.jsx` file by default.

Skill components must be exported by this view (more on this below).

### Lite View

The lite view doesn't include any heavy dependency. Common use case is to add a custom, lightweight component on the web chat. This type of view was added to keep the size of the webchat bundle small so it loads faster, especially on mobile phones.

### Sharing Components Between Modules

It is now a lot easier to expose components for other modules or to use other module's components. Here is a quick example on how the webchat is able to display a component from a specific module:

#### Display a Custom Component Dynamically

When components are loaded this way, they are loaded and displayed immediately where the tag is placed.

**Example:**

```js
// Fetch the module injector. It is available on any of your module's view.
const InjectedModuleView = this.props.bp.getModuleInjector()

// Use is very straightforward: specify the module name, the name of the component, and if it is available on the lite or full view.
<InjectedModuleView moduleName={moduleName} componentName={componentName} lite={true} extraProps={props} />
```

#### Load a Module's Components in Memory

By loading components this way, they aren't displayed immediately on the page.

They are accessible by using `window.botpress['moduleName']['componentName']`.

**Example:**

```js
// The first parameter is the module name, the second specifies if it should load the lite or full view
this.props.bp.loadModuleView(moduleName, true)
```

## Skill Creation

There are a couple of steps required to create a new skill. Basically, a skill consist of a GUI to input values and a flow generator to create the interactions.

### Step 1 - Create Your Visual Component

The first step is to create the GUI that will be displayed to the user. You can create your component in the file `views/full/index.jsx`, or you can create it in a separate file, just make sure to export your skill component.

The name of your component (in the below example, MyCustomSkill) needs to be the same used in step 3 below.

**Example:**

```jsx
import React from "react"

export class MyCustomSkill extends React.Component {
  render() {
    return null
  }
}
```

### Step 2 - Creating the Flow Generator

The flow generator will create all the transitions and conditions based on the data that was feeded by the GUI. That method will be called by the Studio when the user has finished inputting all his data. Your method will receive a `data` object. and must return a partial flow.

**Example:**

```js
const generateFlow = async (
  data: any,
  metadata: sdk.FlowGeneratorMetadata
): Promise<sdk.FlowGenerationResult> => {
  const nodes: sdk.SkillFlowNode[] = [
    {
      name: "entry",
      onEnter: [],
      next: [{ condition: "true", node: "..." }]
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

### Step 3 - Connecting Those Components

Once your view and the flow generator is ready, you need to inform Botpress about your skill.

This is how you would register it:

```js
// Note the array, you can register multiple skills that way
const skillsToRegister: sdk.Skill[] = [
  {
    id: "MyCustomSkill", // Name of your exported component
    name: "My Magic Custom Skill", // Only used to display the skill in the list
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

Modules can register new actions that will be available on the flow editor.

Those actions must be deployed to the `data/global/actions` folder to be recognized by Botpress. Here is how to do that:

1. Create a folder named `actions` in `src`.
1. Add your JavaScript files in the folder.
1. When you build your module, your files will be copied in the `dist` folder.
1. At every startup, action files are copied in `data/global/actions/$MY_MODULE/`.

They are then accessible by the name `$MY_MODULE/$MY_ACTION` in any node or skill.

If your action requires external dependencies, you must add them on your module's `package.json` as dependencies. When the VM is initialized, we redirect `require` requests to the `node_modules` of its parent module.

:::note
Many dependencies are already included with Botpress and do not need to be added to your package (such as lodash, axios, etc.).
:::

## Module-Builder Docker Image

We provide a Docker image that can be used to compile your custom module. This is useful in CI/CD situations, where your pipeline will checkout your Custom Module's source code, and the Docker container will spit out a compiled `.tgz` file.

### Instructions

```
docker run -it --rm -v ${PWD}/modules/:/botpress/modules/ botpress/module-builder:v0_0_2 sh -c 'cd modules/YOUR_CUSTOM_MODULE && yarn && yarn build && yarn package'
cd modules/YOUR_CUSTOM_MODULE
```

The compiled module will be available in the directory you mounted as a `YOUR_CUSTOM_MODULE.tgz` file.
