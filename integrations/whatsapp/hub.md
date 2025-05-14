<iframe src="https://www.youtube.com/embed/Kt4Ay_q-WKI" ></iframe>

The WhatsApp integration allows your AI-powered chatbot to seamlessly connect with WhatsApp, one of the most popular messaging platforms worldwide. Integrate your chatbot with WhatsApp to engage with your audience, automate conversations, and provide instant support. With this integration, you can send messages, handle inquiries, deliver notifications, and perform actions directly within WhatsApp. Leverage WhatsApp's powerful features such as text messages, media sharing, document sharing, and more to create personalized and interactive chatbot experiences. Connect with users on a platform they already use and enhance customer engagement with the WhatsApp Integration for Botpress.

## Migrating from 3.x to 4.x

### Automatic downloading of media files

Previously, accessing the content of media messages (such as images, videos, audio and documents) required authenticating with the WhatsApp API using a valid token. In version 4.0 of WhatsApp, the _Download Media_ parameter enables automatic downloading of media files. These downloaded files do not require authentication for access. However, they do count against your workspace's file storage. To continue using the WhatsApp API URLs, set the _Download Media_ parameter to disabled. The _Downloaded Media Expiry_ parameter allows you to set an expiry time for downloaded files.

### Interactive messages values

In version 4.0 of WhatsApp, all incoming button and list reply messages will include both the text displayed to the user (_text_) and the payload (_value_). Use `event.payload.text` to retrieve the label of a button or choice, and use `event.payload.value` to access the underlying value.

### _postback_ and _say_ messages prefix

In version 4.0 of WhatsApp, _postback_ and _say_ messages no longer use the prefixes `p:` or `s:`. If your bot relied on these prefixes for logic or transitions, you can update it to depend solely on the value set for the postback.

### Start conversation

Version 4.0 of WhatsApp introduces small changes in the call signature of the `startConversation` action:

- The `senderPhoneNumberId` parameter has been renamed to `botPhoneNumberId`
- The input object now includes a single property called `conversation`, which contains the actual arguments

If your bot used the `startConversation` action, make sure all parameters are set. Also, if you called `startConversation` from code, make sure the action is called with the correct arguments:

```ts
actions.whatsapp.startConversation({
  conversation: {
    userPhone: '+1 123 456 7890',
    templateName: 'test_message',
    templateLanguage: 'en',
    templateVariablesJson: JSON.stringify(['First value', 'Second value'])
    botPhoneNumberId: '1234567890'
  }
})
```
