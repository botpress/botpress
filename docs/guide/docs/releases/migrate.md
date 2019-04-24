---
id: migrate
title: Migrations
---

## Migration from 11.7 to 11.8

### Channel-Web Refactor

There was a big refactor of the module to make it easier to customize (custom components and CSS). Every styling classes were extracted in a single file, `default.css`. If you previously customized the webchat, some changes will be required.

Please refer to [default.css](https://github.com/botpress/botpress/tree/master/modules/channel-web/assets/default.css) for the different classes

### Multiple Languages

This feature should have no impact on existing users. If you have created custom content types, however, slight modifications will be required.

- The method `computePreviewText`, should return `undefined` if the required property is not set, instead of trying to display something

```js
// For example
computePreviewText: formData => 'Text: ' + formData.text

// Would become
computePreviewText: formData => formData.text && 'Text: ' + formData.text
```

- When editing a language where a translation is missing, the type of the field must be `i18n_field` to display the original text of the default language.

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

There was a breaking change in how the views are handles by modules. Previously, the main view was `web.bundle.js` and you could define more views in the `liteViews` of the `package.json` file. This caused confusion, because only one of those views can be loaded at a time on the user's browser.

We've decided to remove the configurable `liteViews`. From now on, every module must include a `full` and a `lite` view, even if only one of those (or none) is used. This means that the structure must change, here's a sample of before/after:

```
// This is how the structure used to be:
my-module/views/index.jsx
my-module/views/custom-skill.jsx

// This is the structure you should use:
my-module/views/full/index.jsx
my-module/views/lite/index.jsx
```

This change implied modifications on how modules are packaged. Please clear the `node_modules` folder of every module, then run `yarn build`

For more informations see: [Module Views](../advanced/create-module#views)

## Migration from 11.3 to 11.4

### Teams removed

Teams have been removed in 11.4 in favor of the **Workspace**.
Botpress Workspace is specified by `workspaces.json` and is used to associate bots, users and roles together.

### Bots table removed

**Bots** should be listed by their IDs in `workspaces.json` under `bots`.

### Users table removed

**Users** should be listed by their email in `workspaces.json` under `users`. All user data is stored in the workspace. This includes: email, hashed password and salt, last login, role, creation date.

### User ID -> User Email

User ID has been replaced by user email.

### Roles table removed

**Roles** should be defined in `workspaces.json` under `roles`. Each user have a _role_ property that should match the ID of their corresponding role.

**Rules** should be defined under `roles` / `rules` and respect the same format as before e.g. `[{"res":"*","op":"+r+w"}, {"res":"admin.*","op":"+r-w"}]`

> Multiple workspaces are not supported at this moment. They _might_ be added in a future version.

### Example

Below is an example of a `workspaces.json`:

```json
[
  {
    "name": "Default",
    "users": [
      {
        "email": "renaud@botpress.io",
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
        "description": "Administrators have full access to the workspace including adding members, creating bots and synchronizing changes.",
        "rules": [{ "res": "*", "op": "+r+w" }]
      },
      {
        "id": "dev",
        "name": "Developer",
        "description": "Developers have full read/write access to bots, including flows, content, NLU and actions",
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
        "rules": [{ "res": "*", "op": "+r" }, { "res": "admin.collaborators.*", "op": "-r" }]
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

If your bot has custom logic in `index.js`, such as in bp.hear, that concept has been changed. We replaced those with [hooks](../main/code#hooks). They allow you to intercept events and tell Botpress how to handle them.

Content types are handled similarly, but the UI and Renderers are now bundled in a single file.

### Event parameters

One notable change is the standardization of event parameters. The term `platform` was replaced with `channel`, we now refer to a user/group with `target` and all other parameters related to the type of the event is stored in `payload`. When you send a message to a user, the payload is given to the content renderer, which returns the channel-specific payload.

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

Table was renamed to srv_kvs. The column `botId` was added.

#### Table web_conversations

Added column `botId`

#### Table user_tags

This concept was deprecated, there is no replacement in 11

#### Table users

The table is now called srv_channel users. Custom fields have been removed in favor of attributes.

Those are stored as JSON in the `attributes` column. It gives more flexibility if you want to add more data to users.

#### Table notifications

Table was renamed `srv_notifications` and the column `botId` was added

#### Table logs

Table renamed `srv_logs` and there are multiple columns that were changed.

#### Table hitl_sessions

Added column `botId`
