---
id: nlu
title: NLU
---

# 📚 NLU

A bot tutorial wouldn't be complete without covering Natural Language Understanding (NLU).

## The `nlu` module

Botpress has an official module for easily adding NLU to your bots. Let's start by downloading it and placing it in our bot's modules folder. [Click here for instructions on how to download & install modules](../modules/install)

## Providers

In Botpress, NLU is acheived by connecting with 3rd-party providers such as [Rasa NLU](http://nlu.rasa.ai), [Microsoft LUIS](https://www.luis.ai/), [Google DialogFlow](dialogflow.com) or [IBM Watson NLU](https://www.ibm.com/watson/services/natural-language-understanding/).

> **Note:** For this tutorial, we will use the native (built-in) NLU engine, which is useful for testing purposes or simple classification. For more complex classification and entity extraction, consider [Switching to Rasa or Luis](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-nlu).

## Intent Classification

Intent classification helps you detect the intent of the users. Examples:

- **User said:** _"I want to fly to Dubai"_ , **Intent:** `search_flight`
- **User said:** _"My flight is delayed, help!"_ , **Intent:** `faq_flight_delayed`
- **User said:** _"Can I bring a pet aboard?"_ , **Intent:** `faq_pet`

Intent classification is, in general, a better way than using keywords to understand what the user is trying to say.

## Entity Extraction

Entity Extraction helps you extract and normalize known entities from phrases. Examples:

- **User said:** _"I want to fly to Dubai tomorrow"_ , **Destination:** `Dubai` , **Date:** `01 Jan 2018`

Entity Extraction is usually used in combination with Intent Classification.

## How it works

Botpress abstracts the different NLU providers and provides a clean, easy-to-use interface to do Intent Classification and Entity Extraction. The intents and entities are stored locally (by default in the `./entities` and `./intents` folders) and they follow the source code of your bot so that your NLU and bot logic are always in sync. Importantly this means you have access to and control over your set up data.

> Since the details and inner workings differ from one provider to another, we invite you to read more about the NLU module directly on GitHub.

# 🔨 Adding NLU to our bot

## Creating the intents

For this tutorial, there are two user intents that we want to support: `play` and `see_leaderboard`. A real production bot would usually try to understand more things and be more complete, but for this tutorial, it will be enough.

First, install the [`nlu`](https://github.com/botpress/botpress/tree/master/modules/nlu) module.

Once that's done, restart your bot. You should see a new "NLU" item in the left menu. Open it.

Click the "Create new intent" at the bottom and type `play`.

Now let's add a couple of new utterances (variations) of what a user would usually type if he wanted to say to the bot that he wants to play a new game. About 10 phrases should suffice to start. Don't forget to save the file once you're done.

Do the same for the `leaderboard` intent.

### Training the model

To train your bot using these new intents, simply restart the bot. You should see the training progress in the console.

![Training status in console](assets/nluConsole.jpg)

## Using the intents in flows

The Botpress NLU makes it convenient to test which intent is currently detected by amending the incoming `event` and adding an `nlu` property to it. Let's see how that property looks:

```js
{ intent:
   { name: 'leaderboard',
     confidence: 0.47619047619047616,
     provider: 'native',
     is: [Function: is] },
  entities: [] }
```

We could very easily add a condition similar to the one below in the entry point node of the bot so that if the user starts the conversation with something like "_Who's the best player?_", it would redirect him straight to the `leaderboard` flow.

![Final flow](assets/nluFlow.jpg)

```js
event.nlu.intent.name === 'leaderboard'
// or
event.nlu.intent.is('leaderboard')
```

The latter example has the advantage of being case insensitive and is guaranteed to always be available by the NLU module, even if intent classification fails.

![Flowing to the leaderboard flow](assets/nluLeaderboard.jpg)

## Changing the NLU provider

To change NLU-provider you basically need to change several env-variables so that app knows provider and credentials to use.

```bash
NLU_PROVIDER=luis # can be native, dialogflow, rasa, luis, recast

# Luis
NLU_LUIS_APP_ID
NLU_LUIS_PROGRAMMATIC_KEY
NLU_LUIS_APP_SECRET
NLU_LUIS_APP_REGION # Not required (default is westus)

# DialogFlow
GOOGLE_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS

# RASA
NLU_RASA_URL # Not required (default is http://localhost:5000/)
NLU_RASA_TOKEN # Not required (none by default)
NLU_RASA_PROJECT # Not required (default is botpress)

# RECAST
NLU_RECAST_TOKEN
NLU_RECAST_USER_SLUG
NLU_RECAST_BOT_SLUG
```
