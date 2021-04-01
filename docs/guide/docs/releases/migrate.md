---
id: migrate
title: Migration & Updates
---

## Changelog and Release Notes

Please find the Changelog [here](https://github.com/botpress/botpress/releases) for complete details of Botpress Framework changes by release.

## Migration to Versions 12.X

### Auto-migrate
Botpress 12 comes with an "auto-migration" feature that runs migrations for the database and Botpress config files. No database or file manipulation is required when upgrading from now on.

### Database changes
- Users from `workspaces.json` are now in the `workspace_user` table
- User credentials are stored in the database alongside their auth strategy
- Events are stored in the `events` table

### SQLite
> ⚠️ Please backup your `/data` folder before making any changes

1. Download and extract the new version of Botpress
2. Copy the content of your previous `/data` folder
3. Paste the content into the `/data` folder of the new version, then delete the assets folder.
4. Start Botpress with `--auto-migrate` on the command line or `AUTO_MIGRATE=true` environment variable.

### PostgreSQL

> ⚠️ Please backup your database before making any changes

1. Download and extract the new version of Botpress
2. Start Botpress with `--auto-migrate` on the command line or AUTO_MIGRATE=true environment variable.

To start the latest version of Botpress on a new database, you will need to pull `/data` to your filesystem. Luckily, we have a tool for that:

1. In Botpress running the old version, from the admin section, go to `Profile > Server > Version Control`.
2. Copy the command from Version Control, or **Download archive**.
3. From the old version's root, open a terminal and execute the command. `/data` is now synced to the filesystem.
4. Copy `/data` and paste in the new version's root. If you downloaded the archive, extract its contents to `/data`.
5. Set the environment variable DATABASE_URL to the new database.
6. Start Botpress. The filesystem will sync to the database automatically.

### Custom assets

For both database systems, if you have any custom assets, do these extra steps:

1. Start Botpress, wait for the server to be ready, then stop it. Doing this creates the updated assets for all components.
2. Restore your custom asset files. Check and make sure they are compatible with your latest version.
3. Restart Botpress.


## Migration from 11.7 to 11.8

### Channel-Web Refactor

There was a big refactor of the module to make it easier to customize (custom components and CSS). The refactor resulted in styling classes being extracted into a single file, `default.css`. If you previously customized the webchat, custom CSS will require some changes.

Please refer to [default.css](https://github.com/botpress/botpress/tree/master/modules/channel-web/assets/default.css) for the different classes

### Multiple Languages

This feature should have no impact on existing users. If you have created custom content types, however, they will require slight modifications.

- The method `computePreviewText` should return `undefined` if the required property is not set instead of trying to display something

```js
// For example
computePreviewText: formData => 'Text: ' + formData.text

// Would become
computePreviewText: formData => formData.text && 'Text: ' + formData.text
```

- When editing a language where a translation is missing, the field's type must be `i18n_field` to display the default language's original text.

```js
// Example in the text content type:
 uiSchema: {
  text: {
    // This custom field includes a placeholder with the default language text
    'ui:field': 'i18n_field',

    // This isn't mandatory, but it will display a textarea instead of a simple input field.
    $subtype: 'textarea'
  },
```

## Migration from 11.5 to 11.6

### Custom Modules (target: developers)

There was a breaking change in how modules handle the views. Previously, the main view was `web.bundle.js`, and you could define more views in the `liteViews` of the `package.json` file. This confused the Botpress core engine because the user's browser can load only one of those views at a time.

We've decided to remove the configurable `liteViews`. Every module must include a `full` and a `lite` view, even if only one of those (or none) is used. Here is a before/after sample of that structure change:

```
// This is how the structure used to be:
my-module/views/index.jsx
my-module/views/custom-skill.jsx

// This is the structure you should use:
my-module/views/full/index.jsx
my-module/views/lite/index.jsx
```

This change implied modifications to the packaging of modules. Please clear the `node_modules` folder of every module, then run `yarn build`

For more information see: [Module Views](../advanced/custom-module#views)

## Migration from 11.3 to 11.4

### Teams removed

Teams have been removed in 11.4 in favor of the **Workspace**.
Botpress Workspace is specified by `workspaces.json` and is used to associate bots, users, and roles.

### Bots table removed

**Bots** should be listed by their IDs in `workspaces.json` under `bots`.

### Users table removed

**Users** should be listed by their email in `workspaces.json` under `users`, with all user data is stored in the workspace. This data includes email, hashed password, password salt, last login, role, creation date.

### User ID -> User Email

User ID has been replaced by user email.

### Roles table removed

`workspaces.json` should define ** Roles** under `roles`. Each user has a _role_ property that should match the ID of their corresponding role.

**Rules** should be defined under `roles` / `rules` and respect the same format as before e.g. `[{"res":"*","op":"+r+w"}, {"res":"admin.*","op":"+r-w"}]`

> Botpress doesn't currently support multiple workspaces. They _might_ be added in a future version.

### Example

Below is an example of a `workspaces.json`:

```json
[
  {
    "name": "Default",
    "users": [
      {
        "email": "renaud@botpress.com",
        "password": "<password>",
        "salt": "<salt>",
        "last_ip": "",
        "last_logon": "2019-01-28T19:45:52.490Z",
        "role": "admin",
        "created_on": "2019-01-28T19:45:52.492Z"
      }
    ],
    "bots": ["test"],
    "roles": [
      {
        "id": "admin",
        "name": "Administrator",
        "description": "Administrators have full access to the workspace including adding members, creating bots, and synchronizing changes.",
        "rules": [{ "res": "*", "op": "+r+w" }]
      },
      {
        "id": "dev",
        "name": "Developer",
        "description": "Developers have full read/write access to bots, including flows, content, NLU, and actions",
        "rules": [
          { "res": "*", "op": "+r+w" },
          { "res": "admin.*", "op": "+r-w" },
          { "res": "admin.collaborators.*", "op": "-r" }
        ]
      },
      {
        "id": "editor",
        "name": "Content Editor",
        "description": "Content Editors have read/write access to content and NLU, and read-only access to flows and actions.",
        "rules": [
          { "res": "*", "op": "+r" },
          { "res": "admin.collaborators.*", "op": "-r" }
        ]
      }
    ],
    "defaultRole": "dev",
    "adminRole": "admin"
  }
]
```

## Migration from 10.x to 11.x

This guide will show you how to migrate your bot from Botpress X to Botpress Server.

### Bot content

1. Launch the new Botpress server
1. Create a bot with any name. Your bot files will be in `data/bots/bot-name/`
1. Copy the content of `generated/content` to `data/bots/bot-name/content-elements`
1. Copy the content of `generated/flows` to `data/bots/bot-name/flows`
1. Copy the content of `generated/intents` to `data/bots/bot-name/intents`
1. Copy the content of `generated/qna` to `data/bots/bot-name/qna`

If your bot is using `bp.dialogEngine.registerActions`, this is no longer supported in the new version. Each registered actions must be in a separate `.js` file in the folder `data/global/actions`.

The concept of custom logic in `index.js`, such as in `bp.hear`, has been changed. This custom logic was replaced with [hooks](../main/code#hooks). Hooks allow you to intercept events and tell Botpress how to handle them.

Content types are handled similarly, but the UI and Renderers are now bundled in a single file.

### Event parameters

One notable change is the standardization of event parameters. The term `platform` was replaced with `channel`. We now refer to a user/group with `target`, and all other parameters related to the type of the event is stored in `payload`. When you send a message to a user, the payload is given to the content renderer, which returns the channel-specific payload.

```js
const event = {
  target: 'user1234',
  channel: 'web',
  type: 'text',
  payload: {
    text: 'Hello there',
    typing: true
  }
  preview: 'Hello there'
}
```

### Database

This will require some work on your side since there is no migration script at this time. We are only listing changes in the database.

#### Table kvs

The `kvs` table was renamed to `srv_kvs` and the column `botId` was added.

#### Table web_conversations

Added column `botId`

#### Table user_tags

This concept was deprecated, and there is no replacement in 11

#### Table users

The table is now called srv_channel users. Custom fields have been removed in favor of attributes.

Those are stored as JSON in the `attributes` column. It gives more flexibility if you want to add more data to users.

#### Table notifications

Table was renamed `srv_notifications` and the column `botId` was added

#### Table logs

This table was renamed from `logs` to `srv_logs`, and there are multiple columns that were changed.

#### Table hitl_sessions

Added column `botId`
