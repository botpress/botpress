---
id: version-11.0.1-tutorials
title: Tutorials
original_id: tutorials
---

## Embedding the bot on your website

Embedding a bot to your existing site is quite straightforward. You will need to deploy your bot to a server or hosting provider and make it accessible via a URL. You will then be able to add the following script tag to the end of your `index.html` page.

NB: Remember to replace <your-url-here> with the URL of your bot!

```html
<script src="<your-url-here>/assets/modules/channel-web/inject.js"></script>
```

After the import script above you need to initialize the bot to the `window` object with the script below.

```html
<script>
  window.botpressWebChat.init({ host: '<your-url-here>', botId: '<your-bot-id>' })
</script>
```

And that's it! Once you deploy the changes to your website, the bot will become available, and its button will appear.

There is an example included in the default botpress installation at `http://localhost:3000/assets/modules/channel-web/examples/embedded-webchat.html`

#### Displaying and hiding the webchat programmatically from the website

If the default Botpress button doesn't work for you, it can be changed by adding a `click` event listener to any element on the page. You will also need to pass the `hideWidget` key to your `init` function like this:

```html
<script>
  window.botpressWebChat.init({ host: '<your-url-here>', botId: '<your-bot-id>' hideWidget: true })
</script>
```

Here is some sample code for adding the event listeners to your custom elements:

```html
<script>
  document.getElementById('show-bp').addEventListener('click', () => {
    window.botpressWebChat.sendEvent({ type: 'show' })
  })
  document.getElementById('hide-bp').addEventListener('click', () => {
    window.botpressWebChat.sendEvent({ type: 'hide' })
  })
</script>
```

### Customizing the look and feel of the Webchat

The Webchat view is customizable by passing additional params to the `init` function, below are the options available:

```js
window.botpressWebChat.init({
  host: '<host>',
  botId: '<botId>', //The ID for your bot
  botName: 'Bot', // Name of your bot
  botAvatarUrl: null, // Default avatar URL of the image (e.g., 'https://avatars3.githubusercontent.com/u/1315508?v=4&s=400' )
  botConvoTitle: 'Technical Support', // Title of the first conversation with the bot
  botConvoDescription: '',
  backgroundColor: '#ffffff', // Color of the background
  textColorOnBackground: '#666666', // Color of the text on the background
  foregroundColor: '#0176ff', // Element background color (header, composer, button..)
  textColorOnForeground: '#ffffff', // Element text color (header, composer, button..)
  showUserName: false, // Whether or not to show the user's name
  showUserAvatar: false, // Whether or not to show the user's avatar
  enableTranscriptDownload: false // Whether or not to show the transcript download button
})
```

## Supported databases

Botpress comes with support for SQL databases out-the-box and can be accessed by:

1. The key-value store - This can be accessed via functions like `bp.kvs.get('key')` and `bp.kvs.set('key', 'value', 'path')`
2. A knex-instance - This allows you to work with the DB directly via `bp.db.get()`

### Switching DB to Postgres

By default Botpress uses SQLite as its database. This will be fine for local development and for self-hosted installations, but you may run into issues when hosting using services like Heroku.

To fix this issue and to provide you with a more powerful database, Botpress also supports Postgres.
Switching to it is straightforward.

Firstly, check your `botpress.config.json` for the postgres-configuration section. By default it looks something like this:

```js
  /*
    Postgres configuration
    If Postgres is not enabled, Botpress uses SQLite 3 (file-based database)
  */
 "database": {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "",
    "database": "botpress_test",
    "ssl": false
  }
```

To enable Postgres, you can edit the configuration or pass 2 environment variables: `DATABASE=postgres` and `DATABASE_URL=postgres://login:password@your-db-host.com:5432/your-db-name`. Please make sure you are using Postgres 9.5 or higher.

## Human In The Loop

Botpress allows you to build a powerful tool for autonomous communication with your users.
However there may be cases where it is difficult or very resource-consuming to implement a conversation flow within the bot. At this point you may consider having a human take over the conversation and continue to communicate with your user.

The [Human-in-the-Loop (hitl)](https://github.com/botpress/botpress/tree/master/modules/.hitl) module allows you to do just that!

Human-in-the-Loop is currently supported on `channel-web` and `channel-messenger`.

Once you have this module installed, you will be able to:

1. Pause a user's conversation with the bot
2. Alert your agents that a conversation requires attention
3. As an agent you will be able to continue the conversation via the admin-panel
4. Resume conversation with the bot

### Pausing conversation

There are several ways you can pause the conversation:

- from the admin-panel, toggling the appropriate button
- by performing an API-request:
  - POST /mod/hitl/sessions/{$id}/pause
  - POST /mod/hitl/sessions/{$id}/unpause
  - POST /mod/hitl/channel/{$channel}/user/{$userId}/pause
  - POST /mod/hitl/channel/{$channel}/user/{$userId}/unpause

### Alerting agents

There are a number of ways to alert your agents of a paused conversation, an email, a call to an external API or, as in the example below, via a notification in the admin-panel:

```js
const message = event.user.first_name + ' wants to talk to a human'
bp.notifications.create({ message, level: 'info', url: '/modules/hitl' })
```

The agent can then navigate to the appropriate conversation and take over the conversation from the bot.

### Resuming conversation

Once the agent is done communicating with the user, they can unpause the conversation.

It is also possible for the user to unpause the conversation by calling the API endpoint.

## Jump To

The flow-editor allows you to visually design the flow of the conversation. However, it may be easier for you to jump to a specific conversation node programmatically, when a specific set of conditions is met.

```js
// This should be located inside a hook
const sessionId = bp.dialog.createId(event)
await bp.dialog.jumpTo(sessionId, event, 'main.flow.json', 'target-node')
```

As can be seen in the above example, the `jumpTo` method takes 4 arguments:

- the session id
- the event
- the target flow name
- the target node name (optional - by default it is flow.startNode)

## Acting Proactively

You may wish to make your bot act proactively on your website in response to some action. E.g., suggest they buy the product they are viewing after a set time or ask them for feedback on services they were using.

With Botpress this is simple:

1. First you need to open the bot-window and then trigger a custom action-type (`proactive-trigger` in the example below). These can be triggered by a javascript event such as a timeout.

```js
window.botpressWebChat.sendEvent({ type: 'show' })
window.botpressWebChat.sendEvent({
  type: 'proactive-trigger',
  channel: 'web',
  payload: {
    text: 'smth'
  }
})
```

2. This trigger will be dispatched to the bot so you need to add a handler for it. This should be added as a [Hook](/docs/build/code#hooks)

```js
if (event.type === 'proactive-trigger') {
  const payloads = await bp.cms.renderElement('builtin_text', { text: 'Hey there!', typing: true }, event.channel)
  bp.events.replyToEvent(event, payloads)
}
```

That's it! If you have your builtin renderers registered, the code above will work!

## Shortlinks

In Botpress you can natively create shortlinks to your bot.

This has a number of advantages:

1. Short URLs - no one likes a long URL
2. Flexibility - it allows you to change any of the parameters without affecting the URL

Below is an example where our new shortlink `/s/fullscreen-webchat` will redirect a user to `/lite/bot123?m=platform-webchat&v=fullscreen` (the standard webchat interface) with any additional parameters you specify in the options object.

```js
bp.http.createShortlink('fullscreen-webchat', '/lite/bot123', {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({
    config: {
      /* Custom config here... */
    }
  })
})
```

## Timeouts

Occasionally a user may leave a conversation with your bot part way through the interaction, leaving it in an unwanted state.

This could lead to the bot trying to answer the wrong question when the user returns to the conversation at a later time, which is a bad user experience.

To prevent this Botpress has the ability to set the time-to-live on a session and how often these should be checked. You will find the following options in `data/global/botpress.config.json`.

```js
dialogs: {
  timeoutInterval: '2m', // How much time should pass before session is considered stale
  janitorInterval: '10s' // How often do we check for stale sessions
},
```

This means that if you started a conversation and then didn't respond for 2 minutes, the bot would set your session as expired.
When you then resume the conversation, the bot will start from the beginning.

### Receiving an event when a user timeout

There is a [hook](/docs/build/code#hooks) that is called before the user's session timeouts.

### Performing actions on timeout

When a user's conversation session expires, you are able to trigger an action by specifying the node's name or by having a dedicated timeout flow.

There are 4 ways to handle this. The bot will invoke the first handler set, based on the order below:

1. Using the `timeoutNode` key on a node.

```js
{
  "version": "0.1",
  ...
  "nodes": [
    {
      ...
      "timeoutNode": "<target-node-name>",
    }
  ]
}
```

2. Using the `timeoutNode` key on the flow

```js
{
  "version": "0.1",
  "timeoutNode": "<target-node-name>",
  ...
}
```

3. By adding a node called `timeout` within a flow

```js
{
  "version": "0.1",
  "timeoutNode": "<target-node-name>",
  "startNode": "entry",
  "nodes": [
    ...
    {
      "id": "d29fc6b771",
      "name": "timeout",
      "next": [],
      "onEnter": [],
      "onReceive": []
    },
  ]
}
```

4. Having a dedicated timeout flow file called `timeout.flow.json`

## I18n

Support of multiple languages means answering several questions:

1. How would the bot know which language to use?
2. How would admin add text-translations?
3. How would bot render appropriate content?

### Selecting language

There are many scenarios when dealing with language and depend on your needs, solutions can range from storing a users choice in a variable to fetching the users language from the third-party service.

In our case, we will keep things simple and just a add a Choice for the user to pick from at the beginning of the conversation.

You can then store the user's choice in the `state` by preparing a [simple action](/docs/build/code) for this purpose. Let's assume we offer the choice between English and Arabic, after the user chooses their language, we will set `state.language` either to "En" or "Ar".

### Adopting content schema

Botpress allows you to define a [custom content type](/docs/build/content) that will allow you to store text in multiple languages. Here's an example of a `translate_text` content-type:

```js
function renderElement(data, channel) {
  const language = data.state.language || 'En'
  return [
    {
      type: 'text',
      typing: true,
      markdown: true,
      text: data[`text${language}`],
      'web-style': { direction: language === 'Ar' ? 'rtl' : 'ltr' }
    }
  ]
}

module.exports = {
  id: 'translated_text',
  title: 'Translated Text',
  jsonSchema: {
    title: 'Text Message',
    description: 'A normal text message with translations',
    type: 'object',
    required: ['textEn', 'textAr'],
    properties: {
      textEn: { type: 'string', title: 'Text (English)' },
      textAr: { type: 'string', title: 'Text (Arabic)' }
    }
  },
  uiSchema: {},
  computePreviewText: formData => formData.textEn + ' / ' + formData.textAr,
  renderElemnet: renderElement
}
```

Notice in the above example that via the `web-style` key we are changing the direction in which the text is written, making it right-to-left for Arabic
