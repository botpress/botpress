Channels are the gateway between Botpress and an external communication service.

There are 3 basic type of contents available:

- Text
- Image
- Carousel (includes one or multiple cards)

On top of these basic content types, there are some effects that can be applied. These includes:

- Show buttons to make a quick selection
- Show a dropdown menu to select an item
- Display typing indicator
- Trim long text
- Display text as markdown
- Collect feedback for that element

While all channels should support the basic content types, they are not required to implement all effects.
If an effect is not supported by a channel, it will simply be ignored.

To make implementing a new channel easier, each content type and effects typings are available in the SDK under the namespace `Content`.

## Metadata

Effects are added as metadata on the basic content types.

| Action                | Example                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| Show Buttons          | \_\_buttons: [{ label: 'My choice', value: 'some payload'}]                             |
| Show Dropdown         | \_\_dropdown: [{ label: 'Opt 1', value: 'option1'},{ label: 'Opt 2', value: 'option2'}] |
| Show Typing indicator | \_\_typing: true                                                                        |
| Trim Long Text        | \_\_trimText: 150                                                                       |
| Show as Markdown      | \_\_markdown: true                                                                      |
| Collect user feedback | \_\_collectFeedback: true                                                               |

Here's an example payload if you want to send a text with two buttons:

```js
{
  type: 'text',
  text: 'Some message',
  metadata: {
    __typing: true,
    __buttons: [{ label: 'Opt 1', value: 'option1'},{ label: 'Opt 2', value: 'option2'}]
  }
}
```

There is also an additional property named "extraProps" which includes some internal properties, for example the server's URL:

```js
{
  type: 'image',
  image: '/api/v1/media/file.png',
  extraProps: {
    BOT_URL: 'http://localhost:3000'
  }
  metadata: {
    __typing: true
  }
}
```

## Module Structure

We recommend creating a file named `renderer.ts` which contains a method to convert the payload provided by Botpress to the format used by the channel.

Example:

```js
// renderer.ts
import sdk from 'botpress/sdk'

export const convertPayload = (data: sdk.Content.All) => {
  // adding an if on the type property will provide auto-completion for that type of content
  if (data.type === 'image') {
    // change something and return the changed payload
    return { ...data, type: 'file' }
  }

  // Return the data formatted correctly for your channel
  return data
}
```

Another method named `applyChannelEffects` also needs to be implemented to handle the different effects available for that channel.

```js

const applyChannelEffects = async (event: sdk.IO.OutgoingEvent) => {
  let { payload } = event

  const {
    __buttons,
    __typing,
    __markdown,
    __dropdown,
    __collectFeedback
  } = payload.metadata as sdk.Content.Metadata

  if (__typing) {
    await sendTyping(event)
  }

  // Apply other effects as they are supported on the channel
  if(__markdown){
    data.useMarkdown = true
  }
}
```
