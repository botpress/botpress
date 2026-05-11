<iframe src="https://www.youtube.com/embed/Fs6dIxgEKoY" ></iframe>

The WhatsApp integration allows your AI-powered chatbot to seamlessly connect with WhatsApp, one of the most popular messaging platforms worldwide. Integrate your chatbot with WhatsApp to engage with your audience, automate conversations, and provide instant support. With this integration, you can send messages, handle inquiries, deliver notifications, and perform actions directly within WhatsApp. Leverage WhatsApp's powerful features such as text messages, media sharing, document sharing, and more to create personalized and interactive chatbot experiences. Connect with users on a platform they already use and enhance customer engagement with the WhatsApp Integration for Botpress.

## Card and carousel rendering

WhatsApp has no direct equivalent of Botpress's `card` and `carousel` types. The integration maps each to a native WhatsApp message type:

- `postback` / `say` actions → [Reply Buttons](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-reply-buttons-messages) (up to 3 per bubble)
- `url` actions → [Interactive CTA URL](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-cta-url-messages) (one URL button per bubble)
- A group of cards meeting the carousel rules → Interactive Media Carousel

### Cards

A card renders as one or more bubbles in original action order:

- The first bubble carries the image as a header and the title+subtitle together as the body; later bubbles are minimal.
- More than 3 postback/say buttons are split across multiple bubbles (3 per bubble).
- Multiple URL actions each become their own CTA bubble.

### Carousel

A `carousel` becomes one or more native Carousels (up to 10 cards each) when every card:

- has an `imageUrl`,
- has exactly one `url` action OR 1-2 `postback`/`say` actions (no mixing),
- has a combined title + subtitle body of 160 characters or fewer, and
- has quick-reply values unique across the carousel.

Cards with the same shape are grouped together (up to 10 per group). If any condition fails, or if grouping would leave a single card on its own, the whole carousel renders per-card instead and a warning is logged with the reason.

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
