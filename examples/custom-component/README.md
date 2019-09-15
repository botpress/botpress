## Inject Custom Components on the Web Chat

This module includes 2 different examples on how to customize the web chat with your own components:

- How to display a custom component in the chat (replacing the chat bubble, like a login form or a dropdown menu)
- How to replace the composer (the text zone where the user is typing)

Basic components includes a login form, and another one to make the bot yell.

### What you will learn:

- How to create multiple components and make them available to bots
- How to send your components via Content Elements
- How to send your component using Hooks (actions are very similar)

### How to use

1. Copy this example folder to the `modules` folder
2. Build the component: `yarn && yarn build`
3. Edit your `data/global/botpress.config.json` and add the module location, like below:

```js
"modules": [
  ...
  {
    "location": "MODULES_ROOT/custom-component",
    "enabled": true
  }
]
```

You can then create a test bot directly from the included Bot Template.

If you would like to add these custom elements to an existing bot, please edit `data/bots/your_bot_name/bot.config.json` and add these 2 elements in the `contentTypes` section: `custom_loginform` and `custom_uppercase`
