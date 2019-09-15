---
id: version-11.8.1-content
title: CMS
original_id: content
---

Botpress includes its own **Content Management System** (or **CMS**) to manage all the content of a bot. Everything your bot says comes from the CMS. Before we start discussing how you can create and edit the content of your bot, we should understand the different concepts of the CMS in Botpress.

## Content Type

A **Content Types** defines the structure of what the bot sends. It also tells how the content should be rendered. For instance, a Content Type could be a simple text or an image or a carousel. It can be as simple or as complex as you want. They can describe anything and everything – they most often are domain-specific to your bot.

> **🌟 Tip**: As a general rule, the more domain-specific the Content Types are, the easier it is to manage the bot for non-technical people.

Content Types are very specific to the bots they are associated with. Here are some typical examples:

- A restaurant "Menu" and "MenuPage" types
- A "QuestionWithChoices" type
- An "ImportantBroadcast" type

As you can see, Content Types on Botpress are much more specific than generalized "message types" on traditional bot building platforms.

Content Types are defined by developers in JavaScript. Each Content Type has its own `.js` file and Botpress automatically finds and registers new Content Types based on the directory and naming convention of the file.

## Content Element

A **Content Element** contains the data of a Content Type. Multiple Elements can belong to a single Content Type. For instance, the "text" Content Type will contain an Element for every sentence of your Bot e.g. "Hello!", "What is your name?", etc.

Here's a Content Element example:

```json
{
  "id": "builtin_text-pSsHWg",
  "formData": {
    "text": "👋, {{state.$r}}!",
    "variations": ["Hello, {{state.$r}}!", "Welcome to Botpress, {{state.$r}}!"],
    "typing": true
  },
  "createdBy": "admin",
  "createdOn": "2018-05-14T00:57:36.026Z"
}
```

All Content Elements of the same Content Type are stored within a single `.json` file under the `data/bots/{your-bot}/content-elements/` directory.

> **Tip**: Remember that a Content Type tells **how** content gets rendered and a Content Element tells **what** to render.

## Channel Specific Rendering

All Content Types define a `renderElement` function that tells how a Content Element gets rendered on different channels.

> **Note:** This is critical because every channel is different and has a different set of functionalities. You want to be able to customize and leverage the features of the different platforms to offer the best user experience as possible.

### Example

Here's the web rendering function of the Text Content Type:

```javascript
function renderForWeb(data) {
  const events = []

  if (data.typing) {
    events.push({
      type: 'typing',
      value: data.typing
    })
  }

  return [
    ...events,
    {
      type: 'text',
      markdown: true,
      text: data.text
    }
  ]
}
```

Now if we'd like to render for the messenger channel, we would add a specific rendering function for messenger and call it when `channel === 'messenger'`

```javascript
function renderForMessenger(data) {
  const events = []

  return [
    ...events,
    {
      type: 'message',
      user: data.profile,
      text: data.text,
      raw: data
    }
  ]
}

function renderElement(data, channel) {
  if (channel === 'web') {
    return renderForWeb(data)
  } else if (channel === 'messenger') {
    return renderForMessenger(data) // We add our rendering function
  }

  return []
}
```

## Translation

Your bots can support multiple languages. If a specific translation is not available for the current language, the bot will use the default language. The first time a user chats with your bot, we extract the browser's language and save it as a user attribute (available on the event as `user.language`).

Once that property is set, it will never be overwritten. Therefore, it is possible for you to ask the user what is his preferred language, or to use the NLU engine to detect it.

When rendering content elements, we will try to render the user's configured language, otherwise it will use the bot's default one.
