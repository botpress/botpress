The Line integration enables your chatbot to seamlessly interact with Line, one of the leading messaging platforms. Connect your AI-powered chatbot to Line and unlock powerful communication capabilities to engage with your audience. With this integration, you can automate customer interactions, provide instant support, deliver personalized messages, and handle inquiries seamlessly within the Line messaging environment. Leverage Line's rich features such as text, images, stickers, and location sharing to create dynamic and engaging conversations. Elevate your chatbot's reach and impact by integrating it with Line using the Line Integration for Botpress.

## Migrating from version `1.x.x` to `2.x.x`

### Changes in proactive conversations (and proactive users)

- The process of proactively creating conversations and users has changed. You must now use the actions `getOrCreateConversation` and `getOrCreateUser` to create conversations and users.

### Removal of `markdown` message type

- The `markdown` message type has been removed. Markdown messages must now be sent as regular `text` messages.

## Configuration

1. In your [Line Developers console](https://developers.line.biz/), click on "Providers", select the provider you would like to use or create a new one, and then select or create the Channel you would like to use. If you are creating a new one, select "Messaging API" from the creation menu.
2. For the selected channel, select the Messaging API tab in your channel settings. Scroll to the bottom to "Channel Access Token", and generate a new one or copy an existing one.
3. Paste this into the "Channel Access Token" field in the Botpress Line configuration
4. Go to the channel "Basic settings", scroll to the bottom and copy the "Channel secret".
5. Paste this into the "Channel Secret" in the Botpress Line configuration.
6. Copy the Webhook endpoint url from the Botpress Line configuration.
7. In Line, go to the "Messaging API" tab of the Channel settings, and paste the Botpress Integration Webhook endpoint url into the "Webhook URL", under Webhook settings.
8. Enable the "Use webhook" toggle in Line.

## Content Types Mapping

### From Botpress to LINE

`Text` is mapped to `Text Object`
`Text with Markdown` is mapped to `Text Object`
`Image` is mapped to `Image Object`
`Audio` is mapped to `Audio Object`
`Video` is mapped to `Video Object`
`File` isn’t supported in LINE Message Types
`Location` is mapped to `Location Object`
`Carousel` is mapped to `Flex Object`
`Card` is mapped to `Flex Object`
`Dropdown` is mapped to `Flex Object`
`Choice` is mapped to `Flex Object`
​
### From LINE to Botpress

`Text` is mapped to `Text Object`
The rest of the types aren’t currently processed by Botpress
