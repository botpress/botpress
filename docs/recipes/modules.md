---
layout: guide
---

Why would you need to create modules? You may want to extend botpress functionality in some way, add support of another channel etc. This may be either something usefule for everyone in botpress-community and you may even want to publish your module at npm or this may be something that only makes sense for your particular project and you may want to only include that module to your repository.

Let's say we want to implement a page in admin panel showing overall number of dialog-sessions. Here's how this can be done step by step:

## Initialize new module

1. Let's naviagte to our bot's folder and then create `modules` directory: `mkdir modules && cd modules`
2. Inside modules directory let's initialize our new module: `mkdr botpress-dialog-sessions && cd botpress-dialog-sessions && botpress create`. You'll need to answer questions cli asks you before module will be created
3. Let's install module-dependencies and build it so that we can use it in our bot: `yarn && yarn link && yarn watch`
4. Once module is built, let's add it to `package.json` of our bot:
  ```json
    "botpress-dialog-sessions": "./modules/botpress-dialog-sessions"
  ```
5. Inside bot's directory run `yarn && yarn link botpress-dialog-sessions` to install dependencies and link `botpress-dialog-sessions` (so that it's easy to see the changes we introduce)

If you did everything correct you should now be able to see new item in the admin-panel sidebar called after the name of your bot. You can change that by editing `botpress.menuText` and `botpress.menuIcon` items in `package.json` of your module.

## Adding API-endpoint

To display number of dialog-sessions we'd need to fetch that data on the server and provide it to the client through an API.

This can be done in `src/index.js` file of your module within `ready` function:

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

Here we've added a route handler that will be available under `/api/botpress-dialog-sessions` route that fetches data from DB and returns as json.

## Displaying data on the client

The main view of the module is available under `src/views/index.jsx` file by default. So we can modify it to fetch data from our endpoint and present it to the user like this:

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
      <h4>{`Currently there are ${dialogSessions} dialogsessions in DB`}</h4>
    );
  }
}
```

That's it - wasn't too difficult, right?
