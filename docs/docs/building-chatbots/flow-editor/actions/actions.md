---
id: actions
title: Actions
---

--------------------

Actions are server-side functions executed by the chatbot as part of a conversational flow. Actions have the power to:

- Alter the state of the conversation;
- Send customized messages to the conversation;
- Execute arbitrary code like calling an API or storing data in the database.

Since they are JavaScript functions, they can do pretty much anything and have the following properties:

- `user`: all user attributes.
- `session`: variables kept only for the session.
- `temp`: variables kept only for the flow.
- `bot`: object containing global variables for this bot (same for all users).
- `event`: original (latest) event received from the user.
- `args`: arguments passed to this action from the **Flow** editor.
- `process`: sandboxed VM containing some of the env-variables (starting with `EXPOSED_`).

**Example:**

```js
/** const virtual_machine = async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) { */
user['firstname'] = 'Bob'
user['age'] = 17

temp = {
  text: 'hello there'
}

session.store = [{ id: 1, id: 2, id: 3 }]
/** } */
```

## Registering New Actions

There is two ways to register new actions:

- You can add your JavaScript code in a `.js` file and put it in the folder `data/global/actions`. 
:::note
There is no way to add new ones during runtime programmatically.
::: 

- You can also write actions directly in the Conversation Studio GUI by navigating to the code editor and using an **Action Template**.

We use JavaDoc comments to display meaningful information (such as name, description, arguments, default values) on the dialog flow editor. It is possible to keep an action hidden in the flow editor by adding the flag `@hidden true` in the JavaDoc.

## External Libraries

<!--
:::danger Deprecated Warning
`Libraries` is deprecated and will be removed in Botpress 13.
::: -->

Code in actions should be kept relatively simple. You can set counters, format data, fetch data from an api using the included axios library.
If you need to use npm modules / libraries or libraries from other programming languages, we recommend you either set up a server for that purpose, or use serverless functions and then call the api using Botpress Actions. Using Botpress for heavy javascript computation use cases like image / video processing may cause latency issues for your bot. 

## Disabling Actions

Botpress will ignore files starting with a dot (`.`). This way, you can disable a hook or Action by merely prefixing the file's name with a dot.

## Built-In Actions

### Wait Action

-  **Action Title:** Wait/Delay
-  **Category:** Utility
-  **Author:** Botpress, Inc.
-  **Parameters:** `data_type:number name:delay` (default = 1000) - The number of milliseconds to wait

**Example:**
```
const wait = async delay => {
  return new Promise(resolve => setTimeout(() => resolve(), delay))
}

return wait(args.delay || 1000)
```

:::note
As you can see, the action is just a simple asynchronous arrow function that takes the number of milliseconds to `delay` as a parameter. When building an action, you should specify the action type, its category, the author, and its parameters.
:::

### Append Context

-  **Action Title:** Append Context
-  **Category:** NLU
-  **Author:** Botpress, Inc.
-  **1st Parameter:** `data_type:string name:contexts` - Comma-separated list of contexts
-  **2nd Parameter:** `data_type:string name:[ttl=1]` - Time-To-Live of the context in number of dialog turns. Put `0` to disable expiry.

This action adds context(s) to the list of contexts used by the NLU Engine for subsequent messages for that chat session.

:::note Notes
- If a context were already present in the list, the higher TTL would win.
- To override a specific context, use the `removeContext` action before this action.
:::
 
This method is contextual to the current user chat session. You can specify more than one context by separating them with a comma.

### Remove Context

-  **Action Title:** Remove Context
-  **Category:** NLU
-  **Author:** Botpress, Inc.
-  **Parameter:** `data_type:string name:contexts` - Comma-separated list of contexts

Use this action to remove the provided context(s) from the list of contexts used by the NLU Engine for the subsequent messages for that chat session.

This method is contextual to the current user chat session. You can specify more than one context by separating them with a comma.

### Reset Context

-  **Action Title:** Reset Context
-  **Category:** NLU
-  **Author:** Botpress, Inc.
-  **Parameter:** none

 It resets the NLU context to the default scope. 
 
 This method is contextual to the current user and current chat session.

### Send Feedback

-  **Action Title:** Send Feedback
-  **Category:** NDU66
-  **Author:** Botpress, Inc.
-  **Parameter:**  `data_type:number name:value` - The feedback value. Use `1` for positive feedback, `-1` for negative feedback

Provides feedback (`1` for positive or `-1` for negative feedback) at the end of a goal (a workflow that the user has completed).

### Get Global Variable

-  **Action Title:** Get global variable
-  **Category:** Storage
-  **Author:** Botpress, Inc.
-  **1st Parameter:** `data_type:string name:name` - The name of the variable
-  **2nd Parameter:** `data_type:string name:output` - The state variable to ouput to

This action retrieves a variable that was stored globally using a storage key. Botpress uses a `key: value` storage system to allow complex object storage definitions.

### Reset Global Variable

-  **Action Title:** Reset Global Variable
-  **Category:** Storage
-  **Author:** Botpress, Inc.
-  **Parameter:** `data_type:string name:name` - The name of the variable to be reset

Use this action to reset a variable with global scope.

### Set Global Variable

-  **Action Title:** Set global variable
-  **Category:** Storage
-  **Author:** Botpress, Inc.
-  **1st Parameter:** `data_type:string name:name` - The name of the variable
-  **2nd Parameter:** `data_type:any name:value` - Set the value of the variable
-  **3rd Parameter:** `data_type:string name:[expiry=never]` - Set the expiry of the data, can be `never` or a short string like `6 hours`
-  **4th Parameter:** `data_type:string name:output` - The state variable to output to.

This action allows you to set a variable globally, with optional expiry.

### Set Variable

-  **Action Title:** Set Variable
-  **Category:** Storage
-  **Author:** Botpress, Inc.
-  **1st Parameter:** `data_type:string name:type` - Pick between: user, session, temp, bot
-  **2nd Parameter:**` data_type:string name:name` - The name of the variable
-  **3rd Parameter:** `data_type:any name:value` - Set the value of the variable. Type `null` or leave empty to erase it.

You can use this Action to store data to desired storage based on the time to live expectation.

### Reset Session

-  **Action Title:** Reset Session
-  **Category:** Storage
-  **Author:** Botpress, Inc.
-  **Parameter:** none

This action resets the user session and clears information stored in `temp` and `session` storage for the user. This action doesn't remove NLU Contexts and Last Messages history.

### Switch Language

-  **Action Title:** Switch Language
-  **Category:** Language
-  **Author:** Botpress, Inc.
-  **Parameter:** `data_type:string name:lang` - The language code, e.g. `en`

Valid for Enterprise License holders with multilingual bots, this action lets you change the bot's language for the current user.

Botpress comes pre-packed with a translation engine that helps developers design a bot in one language while catering to users of all supported and configured languages.

## Content Types

Content types are the primary way to display content in the chat.

### Audio

The audio component can stream `MP3` audio (`.mp3`). You could use it to stream music from Spotify or YouTube. This component could also stream audio files stored on your server.

![Music image](/assets/music.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create a video content type in action.
   * ```
   * {
   *  type: 'audio',
   *  video: 'https://URL_TO_YOUR_VIDEO.mp3',
   *  title: 'Random_video',
   *  typing: true
   * }
   * ```
   * @title Display audio in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const audio = await bp.cms.renderElement(
      'builtin_audio',
      {
        type: 'audio',
        title: 'Ort Cloud',
        audio: 'https://ia801901.us.archive.org/13/items/Home-Odyssey/Home-Odyssey-04OortCloud.mp3',
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, audio)
  }

  return myAction()

  /** Your code ends here */
}
```

### Card

A card is a single element of a carousel. It can be view as one card in a deck of cards. The carousel is the whole deck of card.

![Card image](/assets/card.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create an Card content type in action.
   *```
   *   {
   *     type: 'card',
   *     title: 'Botpress',
   *     subtitle: 'Website',
   *     image: 'https://avatars.githubusercontent.com/u/23510677?s=200&v=4',
   *     actions: [{ title: 'Botpress website Documentation', action: 'Open URL', url: 'https://botpress.com/docs' }]
   *   }
   * ```
   * @title Display an Card in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const audio = await bp.cms.renderElement(
      'builtin_card',
      {
        type: 'card',
        title: 'Botpress',
        subtitle: 'Website',
        image: 'https://avatars.githubusercontent.com/u/23510677?s=200&v=4',
        actions: [{ title: 'Botpress website Documentation', action: 'Open URL', url: 'https://botpress.com/docs' }]
      },
      event
    )

    await bp.events.replyToEvent(event, audio)
  }

  return myAction()

  /** Your code ends here */
}
```

### Carousel

A carousel is a series of cards. This component is useful in e-commerce chatbot. The image element can be a URL or a [Data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

![Carousel Image](/assets/carousel.jpg)

**Example:**
```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create a Carousel content type in action.
   * ```
   *   {
   *     type: 'carousel',
   *     items: [
   *       {
   *         title: 'Botpress',
   *         subtitle: 'Website',
   *         image: 'https://avatars.githubusercontent.com/u/23510677?s=200&v=4',
   *         actions: [{ title: 'Botpress website', action: 'Open URL', url: 'https://botpress.com' }]
   *       }
   *     ],
   *     typing: true
   *   },
   * ```
   * @title Display a carousel in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const carousel = await bp.cms.renderElement(
      'builtin_carousel',
      {
        type: 'carousel',
        items: [
          {
            title: 'Botpress',
            subtitle: 'Website',
            image: 'https://avatars.githubusercontent.com/u/23510677?s=200&v=4',
            actions: [{ title: 'Botpress website', action: 'Open URL', url: 'https://botpress.com' }]
          },
          {
            title: 'Botpress Documentation',
            subtitle: 'Website',
            image:
              'data:image/jpeg;base64,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',
            actions: [{ title: 'Botpress website', action: 'Open URL', url: 'https://botpress.com' }]
          }
        ],
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, carousel)
  }

  return myAction()

  /** Your code ends here */
}
```

### Dropdown

A dropdown displays a list of choices.

![Dropdown image](/assets/dropdown.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create a dropdown content type in action.
   *```
   *   {
   *     type: 'dropdown',
   *     message: 'Dropdown Content type',
   *     buttonText: 'Click me',
   *     placeholderText: 'dropdown placeholder',
   *     options: [{ label: 'Food', value: 'apple' }],
   *     width: 10,
   *     displayInKeyboard: false,
   *     allowCreation: false,
   *     allowMultiple: false,
   *     markdown: true,
   *     typing: true
   *  }
   * ```
   * @title Display a dropdown in an action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const dropdown = await bp.cms.renderElement(
      'dropdown',
      {
        type: 'dropdown',
        message: 'Dropdown Content type',
        buttonText: 'Click me',
        placeholderText: 'dropdown placeholder',
        options: [{ label: 'Food', value: 'apple' }],
        markdown: true,
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, dropdown)
  }

  return myAction()

  /** Your code ends here */
}
```

###  Image

You can display images. You can use a URL image or a [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

![Image of the content type image](/assets/image.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create an image content type in action.
   * ```
   * {
   *  type: 'image',
   *  title: 'Random image',
   *  image: 'URL_YOUR_IMAGE',
   *  typing: true
   * }
   * ```
   * @title Display image in action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const image = await bp.cms.renderElement(
      'builtin_image',
      {
        type: 'image',
        image:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Sphalerite_-_Creede%2C_Mineral_County%2C_Colorado%2C_USA.jpg/1920px-Sphalerite_-_Creede%2C_Mineral_County%2C_Colorado%2C_USA.jpg',
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, image)
  }

  return myAction()

  /** Your code ends here */
}
```

### Location

It displays a place on a map. Location is only enabled in the Vonage channel.

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create an location content type in an action.
   * ```
   * {
        type: 'location',
        latitude: '',
        longitude: '',
        address: '',
        title: 'Botpress Office',
        typing: true
   * }
   * ```
   * @title Display an location in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const audio = await bp.cms.renderElement(
      'builtin_location',
      {
        type: 'location',
        latitude: 46.784541,
        longitude: -71.2909357,
        address: '2480 Ch Ste-Foy Bureau 175, Quebec City, Quebec G1V 1T6',
        title: 'Botpress Office',
        typing: true
      },
      event
    )
    await bp.events.replyToEvent(event, audio)
  }

  return myAction()

  /** Your code ends here */
}
```

### File

Botpress can display PDF file. Currently, we are only supporting PDF.

![Image of file](/assets/file.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create an File content type in action.
   * ```
   *   {
   *     type: 'file',
   *     file:
   *       'http://wavelets.ens.fr/BOYCOTT_ELSEVIER/DECLARATIONS/DECLARATIONS/2008_07_01_Aaron_Swartz_Open_Access_Manifesto.pdf',
   *     title: 'Aaron Swartz Guerilla Manifesto',
   *     typing: true
   *   }
   * ```
   * @title Display a file in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const file = await bp.cms.renderElement(
      'builtin_file',
      {
        type: 'file',
        file:
          'http://wavelets.ens.fr/BOYCOTT_ELSEVIER/DECLARATIONS/DECLARATIONS/2008_07_01_Aaron_Swartz_Open_Access_Manifesto.pdf',
        title: 'Aaron Swartz Guerilla Manifesto',
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, file)
  }

  return myAction()

  /** Your code ends here */
}
```

### Single choice

This component carries a message, usually a question, and suggests choices to the user to fulfill the message. The user can only pick one option, and on selecting the preference, you can instruct your chatbot to get a custom value.

![single-choice image](/assets/single-choice.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create a Single-choice content type in action.
   * ```
   *   {
   *     type: 'single-choice',
   *     text: 'Ort Cloud',
   *     isDropdown: 'https://ia801901.us.archive.org/13/items/Home-Odyssey/Home-Odyssey-04OortCloud.mp3',
   *     dropdownPlaceholder: true,
   *     choices: [{ title: 'title', value: 'value' }],
   *     markdown: true,
   *     disableFreeText: true,
   *     typing: true
   *  },
   * ```
   * @title Display a single-choice in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const single_choice = await bp.cms.renderElement(
      'builtin_single-choice',
      {
        type: 'single-choice',
        text: 'Place to eat',
        isDropdown: true,
        dropdownPlaceholder: true,
        choices: [
          { title: 'Burger Place', value: 'Burger' },
          { title: 'Salad Place', value: 'salad' }
        ],
        markdown: true,
        disableFreeText: true,
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, single_choice)
  }

  return myAction()

  /** Your code ends here */
}
```

### Text

The text content type is a regular text message with optional typing indicators and alternates. You can use markdown in your text to add formatting and style, but please ensure that the target channel can render this text.

You can write HTML in the text content on the web channel, and your chatbot will render it correctly. This opens up the possibility of including iFrames and constructing miniature web pages (commonly known as web views) in your content without creating custom components.

![image text](/assets/text.jpg)


**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create a text content type in a action.
   * ```
   * {
   *  type: 'text',
   *  text: 'hello World !',
   *  variations: ['Greeting', 'Bonjour tout le monde'],
   *  markdown: true,
   *  typing: true
   * }
   * ```
   * @title Hello World with a Built-in text
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const text = await bp.cms.renderElement(
      'builtin_text',
      { type: 'text', text: 'Hello World!', typing: true, markdown: true },
      event
    )

    await bp.events.replyToEvent(event, text)
  }

  return myAction()

  /** Your code ends here */
}
```

### Video

You can either upload a video or link to a video file that will be fetched when the content element is invoked.

![image text](/assets/video.jpg)

**Example:**

```
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Show how to create a video content type in a action.
   * ```
   * {
   *  type: 'video',
   *  video: 'https://URL_TO_YOUR_VIDEO.mp4',
   *  title: 'Random_video',
   *  typing: true
   * }
   * ```
   * @title Display an video in the action
   * @category Content type
   * @author Botpress
   */
  const myAction = async () => {
    const video = await bp.cms.renderElement(
      'builtin_video',
      {
        type: 'video',
        title : 'Lady Gaga',
        video: 'https://ia601201.us.archive.org/4/items/Lady_GaGa_Poker_Face_/Lady%20GaGa_Poker%20Face%20.mp4',
        typing: true
      },
      event
    )

    await bp.events.replyToEvent(event, video)
  }

  return myAction()

  /** Your code ends here */
}
```
