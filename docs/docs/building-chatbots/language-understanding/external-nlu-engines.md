---
id: external-nlu-engines
title: External NLU Engines
---

--------------------

Botpress native NLU runs on-premise and supports a finite set of languages. If you plan to develop chatbots in languages that Botpress does not support or if you want to use another NLU solution, then you'll need to set up a 3rd party NLU connector. To achieve this, we'll use the power of Botpress hooks).

## Define Languages
One use-case for a 3rd party NLU is to support more languages in addition to those handled by Botpress Native NLU. For Botpress to keep working correctly with an additional language (defining intents & content), you'll have to tell Botpress the new languages you want to support. To do so, open `botpress.config.json` and set the `additionalLanguages` property. Let's say we want to support **Swedish** and **Norwegian**, the configuration would look like the following:

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

Now that you're done, you can go in your chatbot config page and choose the language(s) you want your chatbot to support. Note that multilingual is a Botpress Enterprise License feature.

## Sync NLU Data to 3rd Party
This function lets you use the Botpress NLU interface to define your intents, entities, and slots. Intents and entities are stored as JSON in BPFS (formerly ghost) on the local filesystem or in the database.

To sync data, we need to listen to any intents/entities changes and persist the data to our 3rd party NLU (please go through the listening to file changes tutorial for more information). This way, when one edits intents or entities in the NLU UI, we get notified. We can do this with a Botpress after bot mount hook. You can use the code editor module to create hooks easily. Here's how the code for our `fileWatcher` hook looks like:

```js
async function sync(bp: typeof sdk, botId: string) {
  // create a BPFS (ghost) instance for our bot
  const ghost = bp.ghost.forBot(botId)

  // listen on file changes
  ghost.onFileChanged(async file => {
    console.log(file)
  })
}

//those parameters are accessible in the current scope
return sync(sdk, botId)
```

`onFileChanged` is called with the file name containing changes when a file is either created, edited or deleted. What we want to do now is to check if the change is relevant (e.g., change in intents/entities) and sync the data to your custom NLU. Our hook will now look like this:

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
      * Here, you would call your own NLU provider by HTTP with processed data
      *
      * await axios.post('http://NLUprovider/train', {intents, entities})
      *
      */
    }
  })
```

Here you go; you can now still use the Botpress NLU UI to define your intents/entities and push training data to your NLU engine.

## Use your 3rd Party NLU for Classification and Extraction
We will use a similar strategy during prediction time. What we want to do is call our 3rd party NLU for each incoming user message. We will use a before incoming hook, executed when Botpress receives a user message. The code is not complex if you keep in mind that Botpress works with a precise data structure, so you'll need to map the response data of your NLU provider to the [Botpress NLU data format](https://botpress.com/reference/interfaces/_botpress_sdk_.io.eventunderstanding.html). The hook will look like the following:

```ts
async function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent) {
  /** Your code starts below */

  const myHook = async (bp, event) => {
    const _ = require('lodash')

    /**
     * Returns the detected language (e.g. 'en', 'fr', 'es', etc) given a string of text
     */
    const detectLanguage = async text => {
      // Here, you can use your own service to detect the language given the user's text
      const response = await axios.get('https://langdetect.yourdomain.com', { input: text })
      return response.data.lang
    }

    /**
     * Given an input and its language, returns a nlu-compatible object
     */
    const predict = async (lang, text) => {
      // Important: the result must have this structure in order
      // for Botpress to process it correctly downstream
      const result = {
        entities: [],
        language: lang,
        detectedLanguage: lang,
        ambiguous: false,
        slots: {},
        intent: { name: 'none', confidence: 1, context: 'global' },
        intents: [],
        errored: false,
        includedContexts: ['global'],
        ms: 0
      }

      let response
      switch (lang) {
        case 'en':
          // You
          response = await axios.get('https://en-server.yourdomain.com', { input: text })
          // You are responsible for mapping the response's data
          // to the result object, so it conforms with Botpress's expected format
          result.intent = response.data.intent
          break
        case 'fr':
          // We only use intents from this service
          response = await axios.get('https://detect.nlpfrancais.fr', { input: text })
          result.intents = response.data.result.intentions
          break
        case 'es':
          // This service returns more relevant information. We reuse
          // slots, intents and intent from the service's response
          response = await axios.get('https://nlufrancais.anothercompany.com', { input: text })
          result.slots = response.data.slots
          result.intents = response.data.intents
          result.intent = response.data.intent
          break
        default:
          break
      }

      return result
    }

    // Filter out unwanted events
    if (event.type === 'session_reset' || event.type === 'visit' || event.type === 'bp_dialog_timeout') {
      return
    }

    // We must disable the native NLU for this even,
    event.setFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU, true)

    // Now, we detect the language from the user's input
    const detectedLanguage = await detectLanguage(event.payload.text)

    // Then we process the user's input, knowing the user's language
    const result = await predict(detectedLanguage, event.payload.text)

    // Finally, we overwrite the nlu property of the event with our results
    _.assign(event, {
      nlu: result
    })
  }

  return myHook(bp, event)

  /** Your code ends here */
}
```

That's about it; you now have Botpress integrated with your 3rd party NLU.
