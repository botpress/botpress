---
layout: guide
---

Why would you need to create modules? Creating a new module allows you to extend Botpress' functionality or add support for another channel. 

For the example in this recipe we are going to implement a page in the admin panel showing the overall number of dialog-sessions. We will walk you thought it step by step:

## Initialize new module

1. Naviagte to your bot's root folder and then create a `modules` directory: 

```bash
mkdir modules && cd modules
```

2. Now you are inside the modules directory, initialize your new module: 

```bash
mkdr botpress-dialog-sessions && cd botpress-dialog-sessions && botpress create
```

> Note: The CLI will ask you some questions that you will need to answer before the module can be initialized

3. Next, install `module-dependencies` and build it so that you can use it in your bot:

```js
yarn && yarn link && yarn watch
```

4. Once module is built, let's add it to `package.json` of our bot:

```json
  "botpress-dialog-sessions": "./modules/botpress-dialog-sessions"
```

5. Return to your bot's root directory (`cd ../..`) and run:

```js
yarn && yarn link botpress-dialog-sessions
``` 
This will install your dependencies and link `botpress-dialog-sessions` (so that you can see the changes made in the module)

If everything went to plan, you should now be able to see new item in the admin-panel sidebar with the same name as your bot.

You can change the displayed name by editing `botpress.menuText` and `botpress.menuIcon` items in `package.json` of your module.

> Note: Should you get an error, please search our [forum](https://help.botpress.io/) to see if anyone has had a similar problem and ask for help from the community.

## Adding API-endpoint

To display the number of dialog-sessions your bot has had, you need to fetch the data from the server and provide it to the client through an API.

This can be done in the `src/index.js` file of your module, within the `ready` function.

```js
  ready: async (bp, configurator, helpers) => {
    // Your module's been loaded by Botpress.
    // Serve your APIs here, execute logic, etc.

    // eslint-disable-next-line no-unused-vars
    const config = await configurator.loadAll();

    const knex = await bp.db.get();

    bp.getRouter("botpress-dialog-sessions").get("/", async (req, res) => {
      const { dialogSessions } = await knex("dialog_sessions")
        .count("id as dialogSessions")
        .first();
      res.send({ dialogSessions });
    });
  }
```

In the example above, we have added a route handler that will be available via `/api/botpress-dialog-sessions` and fetches data from the database and returns the data as json.

## Displaying data on the client

The main view of the module is found in the `src/views/index.jsx` file by default. By modifying this view, you can fetch the data from your new endpoint and present it to the user:

```jsx
export default class TemplateModule extends React.Component {
  state = { dialogSessions: 0 };

  componentDidMount() {
    fetch("/api/botpress-dialog-sessions")
      .then(res => res.json())
      .then(({ dialogSessions }) => this.setState({ dialogSessions }));
  }

  render() {
    const { dialogSessions } = this.state;
    return (
      <h4>{`Currently there are ${dialogSessions} dialog sessions in DB`}</h4>
    );
  }
}
```

That's it - wasn't too difficult, right?

## Database

Botpress can work with two databses (`DB`): sqlite OR Postgres.
Main process with `DB` is located within [core module](https://github.com/botpress/botpress/tree/master/packages/core/botpress/src/database).
But other modules may have their own `DB` logic.

### DB migration

If you need to create migration in your module, do the following:

1) Create `migrations` directory in your modules root folder.

2) Every file in `migrations` directory must be named like this: `[timastamp]__[migration__name].js`

3) Your file must contain following structure:

```javascript
module.exports = {
  up: knex => {},
  down: knex => {}
}
```

Modules migration runs every time when bot start works.

**Note:** We implemented only `up()` migration. `down` can only run manually.

## Next steps

Now you have created your shiny new module it falls into one of two catagories: bespoke or reuseable. 

A bespoke module is one that tackles a problem that is specific to your domain and is unlikely to be useful to others.

A reuseable module, as the name suggests, is a module that domain agnostic and can be used across a number of bots. If you have created a reuseable module and think that it maybe of use to others in the Botpress community, please consider publishing it to [npm](https://docs.npmjs.com/cli/publish).
