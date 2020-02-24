---
id: 3rd-party-NLU
title: Using a 3rd party NLU
---

## Overview

Botpress native NLU runs on premise and supports a finite set of languages. If you plan do develop bots in languages that are not supported by Botpress or if you simply want to use another NLU solution, then you'll need to setup a 3rd party NLU connector. To achieve this we'll use the power of Botpress [Hooks](../main/code#hooks).

### Define languages

One use case of using a 3rd party NLU is to support more languages then those handled by Botpress Native NLU. In order for Botpress to keep working properly (defining intents & content), you'll have to tell Botpress what are the new languages you want to support. To do so, open `botpress.config.json` and set the `additionalLanguages` property. Let's say we want to support **Swedish** and **Norwegian**, the configuration would look like the following:

```json
{
  "additionalLanguages": [
    {
      "code": "sv",
      "name": "Swedish"
    },
    {
      "code": "no",
      "name": "Norwegian"
    }
  ]
}
```

Now that this is done, you can go in your bot config page and choose the language(s) you want your bot to support. For more details on this [check the docs](../advanced/i18n). Note that multilingual is a Botpress Pro feature.

### Sync NLU data to 3rd party

This section is useful if you want to use the Botpress NLU user interface to define your intents, entities and slots. You can skip if this section if you don't want to use the user interface.

Intents and entities are stored as JSON in BPFS (formerly ghost) which stores data either on local filesystem or in the database. The first thing we want to do is to listen on any intents/entities changes and sync the data to our 3rd party NLU (same as the [previous tutorial](listen-file-changes)). This way, when one edits intent or entities in the NLU UI, we get notified. We can do this with a Botpress [after bot mount hook](../main/code#after-bot-mount). You can use the code editor module to create hooks easily. Here's how the code for our `fileWatcher` looks like.

```js
async function sync(bp: typeof sdk, botId: string) {
  // create a BPFS (ghost) instance for our bot
  const ghost = bp.ghost.forBot(botId)

  // listen on file changes
  ghost.onFileChanged(async file => {
    console.log(file)
  })
}

//those parameters area accessible in current scope
return sync(sdk, botId)
```

`onFileChanged` is called with the file name containing changes when a file is either created, edited or deleted.
What we want to do now is to check if the change is relevant (i.e change in intents/entities) and sync the data to your custom NLU. Our hook will now look like this:

```js
const axios = require('axios')
async function sync(bp: typeof sdk, botId: string) {
  const ghost = bp.ghost.forBot(botId)
  ghost.onFileChanged(async f => {
    if (f.includes('intents') || f.includes('entities')) {
      // we get all intents
      const intentNames = await ghost.directoryListing('intents', '*.json')
      const intents = await Promise.all(intentNames.map(name => ghost.readFileAsObject('intents', name)))
      // we get all entities
      const entNames = await ghost.directoryListing('entities', '*.json')
      const entities = await Promise.all(entNames.map(name => ghost.readFileAsObject('entities', name)))
      // TODO process intents and entities in the format required by your NLU

      /*
      * Here you would call your own NLU provider by http with processed data
      *
      * await axios.post('http://NLUprovider/train', {intents, entities})
      *
      */
    }
  })
```

Here you go, you can now still use the Botpress NLU UI to define your intents/entities and push training data to your NLU engine.

### Use your 3rd Party NLU for classification and extraction

We will use a similar strategy for prediction time. Basically, what we want to do is call our 3rd party NLU for each incoming user message. We will use a [before incoming hook](../main/code#before-incoming-middleware) which is fired when a user message gets in Botpress. The code is not complex, just keep in mind that Botpress works with a precise data structure, so you'll need to map the response data of your NLU provider to [Botpress NLU data format](https://botpress.com/reference/interfaces/_botpress_sdk_.io.eventunderstanding.html). The hook will look like the following:

```js
  const axios = require('axios')
  function mapPoviderDataToBotpress(data: any): sdk.IO.EventUnderstanding {
    /**
    * Mapping code goes here, make sure returned data is properly formatted
    */
    // this is placeholder data, return properly formatted
    return {
      ambiguous: false,
      language: 'en',
      detectedLanguage: 'en',
      entities: [],
      errored: false,
      includedContexts: ['global'],
      intent: { name: 'none', confidence:, context: 'global' },
      intents: [],
      slots: {}
    }
  }

  async function hook() {
    // filter out unwanted events
    if (event.type === 'session_reset' || event.type === 'visit' || event.type === 'bp_dialog_timeout') {
      return
    }
    // event is accessible within current context
    const botId = event.botId
    const text = event.preview

    // it's up to you to pass appropriate parameters and change URL according to your NLU provider
    const response = await axios.post('https://NLUprovider/extract', { text: text, projectId: botId })

    // we transform the data retrieved from our external NLU provider to Botpress EventUnderstanding schema and assign it to event.
    event.nlu = mapPoviderDataToBotpress(response.data)
  }

  return hook()
```

If you want a detailed implementation of this, there's a working [**Recast AI**](https://recast.ai) example that you can enable by removing the `.` prefix to the `hooks/before_incoming_middleware/.05_recast_nlu.js` file.

That's about it, you now have Botpress integrated with your 3rd party NLU.
