---
layout: guide
---

The Universal Message Markdown (abbreviated as “UMM") is the Botpress feature that allows to provide reusable message "blocs", as well as content formatters for the content managed through the [Content Manager](/docs/foundamentals/content).

## The focus of UMM <a class="toc" id="toc-the-focus-of-umm" href="#toc-the-focus-of-umm"></a>

Using UMM, developers can define how your content will be received by the users. This means that UMM does not deal with anything else that is not related to how messages are sent or displayed on user's devices.

It works on any platform because it doesn’t abstract or hinder their features. We believe in platform specialization, which is why UMM doesn’t try to get your message working on every platform automatically (and failing at delivering a good user experience). SMS and Facebook Messenger are two very different channels with very different features; trying to make the exact same messages render well on both platform is a recipe for disaster. If your bot supports multiple channels, you should simply instruct the bot how you want these messages to be rendered and delivered on the different platforms.

## The benefits of UMM <a class="toc" id="toc-the-benefits-of-umm" href="#toc-the-benefits-of-umm"></a>

- Works on every platform
- You can change content through the [Content Manager](/docs/foundamentals/content) without redeploying the bot, UMM blocs are generic formatters
- Source-controlled for easy collaboration, deployment and review

## Where can you use UMM? <a class="toc" id="toc-where-can-you-use-umm" href="#toc-where-can-you-use-umm"></a>

UMM can be used to reply to any incoming messages. It can also be used to automatically format the content (managed through the [Content Manager](/docs/foundamentals/content)) when it's sent to the user. It allows you to differently format the same content for different target platofrms (like Facebook Messenger, Slack, or SMS).

## Cool, how do I use it? <a class="toc" id="toc-cool-how-do-i-use-it" href="#toc-cool-how-do-i-use-it"></a>


UMM blocs are defined in your bot's source files. In the default bot check the example in the `index.js` file.

You can send [reactive](/docs/foundamentals/events#toc-reactive-outgoing) or [proactive](/docs/foundamentals/events#toc-sending-messages-outgoing) UMM messages.

### Short usage guide <a class="toc" id="toc-short-usage-guide" href="#toc-short-usage-guide"></a>

Open your `index.js` file and put the following code in it:

```js
bp.umm.registerBloc('#helloBloc', () =>
  'Hello {{user.first_name}}!'
)

bp.umm.registerBloc('#sayAge', () =>
  'Wow! {{age}} is pretty old!'
)

bp.umm.registerBloc('#byeBloc', () =>
  'Goodbye, {{user.first_name}} :)'
)
```

Then you can use these UMM blocs in your code (later in the same `index.js`):

```js
bp.hear(/hello/i, (event, next) => {
  event.reply('#helloBloc')
})

bp.hear(/I am (.+) years old/i, (event, next) => {
  // You can pass arbitrary variables to the second argument of `reply`
  event.reply('#sayAge', { age: event.captured[0] })
})

bp.hear(/bye/i, (event, next) => {
  event.reply('#byeBloc')
})
```

## Examples {#examples}

A single bloc sending two messages:

```js
bp.umm.registerBloc('#gettingStarted', () => [
  'Hello!',
  'How are you?'
])
```

A bloc sending two messages, with typing indicators and a 2 second wait between the two messages:

```js
bp.umm.registerBloc('#gettingStarted', () => [
  {
    text: 'Hello!',
    typing: true
  },
  {
    wait: '2s'
  },
  {
    text: 'How are you?',
    typing: true
  }
])
```

A bloc sending two messages, the 2nd of which is rendering differently on SMS and Facebook Messenger:

```js
bp.umm.registerBloc('#gettingStarted', () => [
  {
    text: 'Hello!'
  },
  {
    on: 'facebook',
    text: 'How are you doing? Please use the buttons below!',
    quick_replies: [
      '<QR_GOOD> Good!',
      '<QR_BAD> Bad 😔'
    ]
  },
  {
    on: 'sms',
    text: 'How are you?'
  }
])
```

A bloc sending the recent tweets:

```js
bp.umm.registerBloc('#sendTweets', ({ tweets }) => [
  "Here's the latest tweets",
].concat(tweets.map(({ auhtor, tweet}) => `
  Sent by: ${author}
  Tweet: ${tweet}
`))).concat([
  'Want to see more?'
])
```

## Documentation <a class="toc" id="toc-documentation" href="#toc-documentation"></a>

There are few things you should know:
- A bloc is defined as a function returning one of the following:
  * a string (single message),
  * an object (message with extra options like typing indicator, etc.),
  * or an array of the previous.
- Anywhere in the strings you can use Mustache templating syntax, which will be parsed before sending the message.
- The important thing you need to learn to use UMM is the built-in message properties and the platform-specific message properties. The best way to learn the built-in message properties is by reading this document, while the best way to learn the platform-specific properties is to use the respective platform examples/templates.

### Built-in message properties <a class="toc" id="toc-built-in-message-properties" href="#toc-built-in-message-properties"></a>

#### `text: <STRING>`

If your message is a single string (without extra properties) you can use it directly.

##### Example:

```js
const _ = require('lodash')
// pick a string randomly at runtime
bp.umm.registerBloc('#blocName', () => _.sample([
  'Hello', 'Good day', 'Hey'
]))
```

#### `typing: <TRUE or DURATION>`

##### Examples:

- `{ text: '...', typing: true }`
- `{ text: '...', typing: '200ms' }`
- `{ text: '...', typing: '2s' }`
- `{ text: '...', typing: '2weeks' }`

#### `wait: <DURATION>`

##### Example:

`{ wait: '5s' }`

#### `if: <BOOLEAN>`

Shows this message only if the condition is met

#### `unless: <BOOLEAN>`

Shows this message only if the condition isn't met

#### `on: <STRING or OBJECT>`

**As a string**: Defines on which platform(s) this message should render. You can specify multiple platforms by separating them with a `+`. e.g. `facebook + sms`

**As an object**: Defines additional properties (or override existing properties) for the platform(s) specified in the object keys. Example:

```js
bp.umm.registerBloc('#blocName', () => ({
  text: 'Hello on all platforms',
  on: {
    facebook: {
      text: 'Different Hello on Facebook'
    }
  }
}))
```

## How it works <a class="toc" id="toc-how-it-works" href="#toc-how-it-works"></a>

At Send Time, the UMM engine will instantiate the bloc (call your function providing the context), then replace the Mustache variables in any strings inside of your bloc, then hand off the processing of the bloc to the appropriate connector module.

## API <a class="toc" id="toc-api" href="#toc-toc-api"></a>

### `bp.umm.registerBloc(blocName: String, blocFn: Function)`

Registers the bloc by name. This name can later be used in `event.reply()`, or in the Content Manager forms definition. The second argument is the function that receives the context (see below) and should return one or more messages (explained in the previous sections).

The `blocName` can start from the optional `#` character.

### `bp.umm.unregisterBloc(blocName: String)`

Deletes the previously recorded bloc. Will throw if the bloc name wasn't registered before.

The `blocName` can start from the optional `#` character.

### `bp.umm.isBlocRegistered(blocName: String)`

Tells if the bloc was previously registered.

The `blocName` can start from the optional `#` character.

## Bloc Context <a class="toc" id="toc-bloc-context" href="#toc-toc-bloc-context"></a>

When the bloc function (the one you regiser using the `registerBloc` method) is invoked it's passed a single object — the context.

This same context is also used to process any mustache syntax inside of the function result.

The context is built by merging the following properties together:

1. the content item properties, if the UMM bloc is used to decorate the [content](/docs/foundamentals/content). For example, in the trivia questions example described there, the context will contain fields `question`, `good`, `bad`
1. `originalEvent`, for example, if you're doing `event.reply('#bloc')`, `originalEvent` will refer to `event`
1. `user`, user profile, same as `originalEvent.user`
1. any additional properties passed to `event.reply`, for example, if you call `event.reply('#bloc', { a: 1, b: 2 })`, `a` and `b` will be the properties of the context.
