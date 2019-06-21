---
id: version-11.9.5-existing-backend
title: Connecting your bot with your existing backend
original_id: existing-backend
---

Botpress makes it easy to communicate data securely between your backend and your bot using JWT. Store any data you'd like in the token and pass it to the webchat using the `externalAuthToken` configuration option.

If the token is valid, the content will be available under `event.credentials` when processing the event. If there is no token or if it is invalid, `credentials` will stay undefined.

How to enable:

1. Configure `pro.externalAuth` in the file `botpress.config.json`
2. Create a file named `key.pub` in the folder `data/global` containing the public key

How to use:

You can either define the token when the chat is initialized: `window.botpressWebChat.init({ externalAuthToken: 'userToken' })` or you can configure it while the conversation is ongoing: `window.botpressWebChat.configure({ externalAuthToken: 'userToken' })`.

## Persisting the user's profile

Once the user is authenticated, you may want to extract some informations out of the credentials to save them in the `user` state, like the First name, Last name, etc. All you need to do is set up a hook listening for a certain type of event, for example `update_profile`. Then, just select the required fields

Example:

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

## Using a Custom User ID

Users get a new unique User ID each time they use a different device. To offer a consistent user experience across different devices, you may want to provide your customer with the same Botpress User ID to make available past conversations, user data, etc.

The `window.botpressWebChat` methods `init` and `configure` both accepts the `userId` parameter. It will override the randomly generated one.
Since the User ID allows BP to recognize the user and to continue a conversation, these should not be guessable and needs to be unique.

## Using Custom Components to render special content

Botpress already supports multiple different type of contents, but it is also possible to add new ones. The only way to add custom components is to create a new module. There is more details about that process on the [Creating Modules](../advanced/custom-module/#views) page.

Once your component is created, you need to send a custom event to the web channel for it to render. There are two different ways to do that:

1. Create a content type
2. Use the Botpress SDK to send an event

The event needs to be of type `custom` and it requires the name of your module and the name of the views. Any additional parameters will be passed on to your component

Here's an example of custom event:

```js
{
  type: 'custom',
  module: 'myModuleName',
  view: 'MyViewName',
  someotherdata: ....
}
```
