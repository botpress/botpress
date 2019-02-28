## Inject Custom Components on the Web Chat

This module will show you how to easily create new components and how to display them on the webchat.
Example components includes a login form, and another one to send all text in upper case

There are two provided examples on how to use the components: via Content Elements and Hooks (actions would be very similar)

## How to use

1. Build the component: `yarn && yarn build`

2. Edit your botpress.config.json to load your module:

```js
"modules": [
  ...
  {
    "location": "MODULES_ROOT/custom-component",
    "enabled": true
  }
]
```

3. Create a test bot with the custom bot template, which will automatically include the custom components.
   You can also add the new types in an existing bot (custom_loginform and custom_uppercase)
