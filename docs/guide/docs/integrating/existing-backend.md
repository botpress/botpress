---
id: existing-backend
title: Connecting An Existing Backend
---
![This feature is available to Botpress Enterprise license holders.](assets/botpress-enterprise-feature.png)
Botpress makes it easy to transmit data securely between your backend and your chatbotusing JWT. Store any data you'd like in the token and pass it to the web chat using the `externalAuthToken` configuration option.

The content will be available under `event.credentials` when processing the event if the token is valid. If there is no token or if it is invalid, `credentials` will stay undefined.

## Enabling

1. Configure `pro.externalAuth` in the file `botpress.config.json.`
2. Create a file named `key.pub` in the folder `data/global` containing the public key

## Usage

You can either define the token when the chat is initialized: `window.botpressWebChat.init({ externalAuthToken: 'userToken' })` or you can configure it while the conversation is ongoing: `window.botpressWebChat.configure({ externalAuthToken: 'userToken' })`.

## Persisting the user's profile

Once Botpress authenticates a user, you may want to extract some information from the credentials to save them in the `user` state, like the First name, Last name, etc. All you need to do is set up a hook listening for a specific type of event, for example, `update_profile`. Then, select the required fields.

Example of a hook listening for an event:

```js
if (event.type === 'update_profile') {
  if (event.credentials) {
    event.state.user = {
      firstname: event.credentials.firstname,
      lastname: event.credentials.lastname
    }

    // This tells the State Manager to persist the values you defined for `user`
    event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
  } else {
    console.log('Token seems invalid ')
  }

  // Since it's a custom event, we can safely skip the dialog engine
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
}
```

Then send a custom event : `window.botpressWebChat.sendEvent({ type: 'update_profile' })`

## Custom User ID

Users get a new unique User ID each time they use a different device. To offer a consistent user experience across other devices, you may want to provide your customer with the same Botpress User ID to ensure past conversations and user data are available.

The `window.botpressWebChat` methods `init` and `configure` both accept the `userId` parameter. It will override the randomly generated one. Since the User ID allows BP to recognize the user and continue a conversation, these should not be guessable and need to be unique for each user.

## Custom Components for Content

Botpress already supports different types of content, but it is also possible to add new ones. The only way to add custom components is to create a new module. More details about that process are on the [Creating Modules](../custom/custom-module#views) page.

Once your component is created, you need to send a custom event to the web channel to render. There are two different ways to do that:

1. Create a content type
2. Use the Botpress SDK to send an event

The event needs to be of type `custom`, and it requires the name of your module and the name of the views. Botpress will pass on any additional parameters to your component.

Here's an example of a custom event:

```js
{
  type: 'custom',
  module: 'myModuleName',
  view: 'MyViewName',
  someotherdata: ....
}
```
