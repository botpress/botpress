---
layout: guide
---

The Universal Message Markdown (abbreviated as “UMM") is a simple, lightweight markdown language that makes it really easy for everybody to create message templates for one or many messaging platforms. The purpose of the language is to favour speed, simplicity and flexibility. There is virtually no learning curve, making it is as easy to use for content editors as it is for developers.

## The focus of UMM <a class="toc" id="toc-the-focus-of-umm" href="#toc-the-focus-of-umm"></a>

Using UMM, anybody (including non-programmers) is able to create and edit the actual messages that the bot sends to the users. Its name starts with Universal because it works for every platform and can be used by anybody. The single responsibility of UMM is to dictate how your content will be received by the users. This means that UMM does not deal with anything else that is not related to how messages are sent or displayed on user's devices.

It works on any platform because it doesn’t abstract or hinder their features. We believe in platform specialization, which is why UMM doesn’t try to get your message working on every platform automatically (and failing at delivering a good user experience). SMS and Facebook Messenger are two very different channels with very different features; trying to make the exact same messages render well on both platform is a recipe for disaster. If your bot supports multiple channels, you should simply instruct the bot how you want these messages to be rendered and delivered on the different platforms.

## The benefits of UMM <a class="toc" id="toc-the-benefits-of-umm" href="#toc-the-benefits-of-umm"></a>

- Works on every platform
- So easy to learn that everybody can use it
- You can change content on the fly without redeploying the bot
- Source-controlled for easy collaboration, deployment and review
- Visual feedback (like traditional Markdown)

## Where can you use UMM? <a class="toc" id="toc-where-can-you-use-umm" href="#toc-where-can-you-use-umm"></a>

UMM is currently in its initial phase and you can use it to reply to any incoming messages. If it turns out to be appreciated by the community, we’ll roll out UMM support in all major modules and build additional visual support for it.

## Cool, how do I use it? <a class="toc" id="toc-cool-how-do-i-use-it" href="#toc-cool-how-do-i-use-it"></a>


UMM is currently located in a single file: `content.yml`. Simply open this file and you'll see some default content there.

You can send [reactive](/docs/foundamentals/events#toc-reactive-outgoing) or [proactive](/docs/foundamentals/events#toc-sending-messages-outgoing) UMM messages.

### Short usage guide <a class="toc" id="toc-short-usage-guide" href="#toc-short-usage-guide"></a>


Open your `content.yml` file and put the following code in it:

```yaml
helloBloc:
  - Hello {{user.first_name}} !

sayAge:
  - Wow! {{age}} is pretty old!

byeBloc:
  - Goodbye, {{user.first_name}} :)
```

Then you can use these two UMM blocs in your code (`index.js`):

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

```yaml
gettingStarted:
  - Hello!
  - How are you?
```

A bloc sending two messages, with typing indicators and a 2 second wait between the two messages:

```yaml
gettingStarted:
  - text: Hello!
    typing: true
  - wait: 2s
  - text: How are you?
    typing: true
```

A bloc sending two messages, rendering differently on SMS and Facebook Messenger:

```yaml
gettingStarted:
  - text: Hello!

  - on: facebook
    text: How are you doing? Please use the buttons below!
    quick_replies:
      - <QR_GOOD> Good!
      - <QR_BAD> Bad 😔

  - on: sms
    text: How are you?
```

A bloc sending the recent tweets:

```yaml
sendTweets:
  - Here's the latest tweets

  {{#tweets}}
  - text: | # This is a YAML multi-line text
    Sent by: {{author}}
    Tweet: {{tweet}}
  {{/tweets}}

  - Want to see more?
```

## Documentation <a class="toc" id="toc-documentation" href="#toc-documentation"></a>

There are few things you should know:
- A bloc is defined in pure YAML syntax. There is no customization or special rules. We’re only using very basic YAML features in this document but any valid YAML will be parsed correctly.
- Anywhere in the document you can use Mustache templating syntax, which will be parsed before the YAML. So any Mustache output must give valid YAML.
- The content.yml file (at the root directory of your bot) contains all the message blocs.
- A bloc can contain one or many messages. The body of a bloc should always be an array.
- The only thing you must learn to use UMM is the built-in message properties and the platform-specific message properties. The best way to learn the built-in message properties is by reading this document, while the best way to learn the platform-specific properties is to use the respective platform examples/templates.

### Built-in message properties <a class="toc" id="toc-built-in-message-properties" href="#toc-built-in-message-properties"></a>

#### `text: <STRING or ARRAY>`

If array, picks a random string every time.

##### Examples:

```yaml
blocName:
  - text: # Random string
    - Hello
    - Good day
    - Hey
```

#### `typing: <TRUE or DURATION>`

##### Examples:

- `typing: true`
- `typing: 200ms`
- `typing: 2s`
- `typing: 2weeks`

#### `wait: <DURATION>`

#### `if: <BOOLEAN>`

Shows this message only if the condition is met

#### `unless: <BOOLEAN>`

Shows this message only if the condition isn't met

#### `on: <STRING or OBJECT>`

**As a string**: Defines on which platform(s) this message should render. You can specify multiple platforms by separating them with a `+`. e.g. `facebook + sms`

**As an object**: Defines additional properties (or override existing properties) for the platform(s) specified in the object keys. Example:

```yaml
blocName:
  - text: Hello on all platforms
    on:
      facebook:
        text: Different Hello on Facebook
```

## The problems with programmatic content creation <a class="toc" id="toc-the-problems-with-programmatic-content-creation" href="#toc-the-problems-with-programmatic-content-creation"></a>


There are many problems with traditional, programmatic definition of messages like you must use on the other frameworks. Just to name a few:

 - Content Editors must learn how to code and redeploy the bot
 - The Content ends up being mixed with the Flow
 - No visual feedback on how the message will actually look like
 - Hard or impossible to leverage platform-specific message types
 - Steep learning curve and not straightforward

## How it works <a class="toc" id="toc-how-it-works" href="#toc-how-it-works"></a>

The UMM language is essentially only a combination of two things: YAML + Mustache templates. Using YAML, you create blocs that define one or many messages and how they will be sent by the different messaging platforms. The messages can contain some templating variables (using Mustache syntax). At Send Time, the UMM engine will process the bloc, replacing variables first then hand off the processing of the bloc to the appropriate connector module. It’s really that simple.
