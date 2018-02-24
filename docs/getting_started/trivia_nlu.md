---
layout: guide
---

# 📚 NLU

A bot tutorial wouldn't be complete without covering Natural Language Understanding (NLU).

## The `botpress-nlu` module

Botpress has an official module for easily adding NLU to your bots. Let's start by installing this module:

```bash
# using npm
npm install --save botpress-nlu

# using yarn
yarn add botpress-nlu
```

## Providers

In Botpress, NLU is acheived by connecting with 3rd-party providers such as [Rasa NLU](http://nlu.rasa.ai), [Microsoft LUIS](https://www.luis.ai/), [Google DialogFlow](dialogflow.com) or [IBM Watson NLU](https://www.ibm.com/watson/services/natural-language-understanding/).

> **Note:** For this tutorial, we will use the native (built-in) NLU engine, which is useful for testing purposes or for simple classification. For more complex classification and entity extraction, consider [Switching to Rasa or Luis](https://github.com/botpress/botpress-nlu).

## Intent Classification

Intent classification helps you detect the intent of the users. Examples:
- **User said:** *"I want to fly to Dubai"* , **Intent:** `search_flight`
- **User said:** *"My flight is delayed, help!"* , **Intent:** `faq_flight_delayed`
- **User said:** *"Can I bring a pet aboard?"* , **Intent:** `faq_pet`

Intent classification is in general a better way than using keywords to understand what the user is trying to say.

## Entity Extraction

Entity Extraction helps you extract and normalize known entities from phrases. Examples:
- **User said:** *"I want to fly to Dubai tomorrow"* , **Destination:** `Dubai` , **Date:** `01 Jan 2018` 

Entity Extraction is usually used in combination with Intent Classification.

## How it works

Botpress abstracts the different NLU providers and provides a clean, easy-to-use interface to do Intent Classification and Entity Extraction. The intents and entities are stored locally (by default in the `./entities` and `./intents` folders) and they follow the source code of your bot, so that your NLU and bot logic are always in sync.  Importantly this means you have access to and control over your set up data.

> Since the details and inner workings differ from one provider to another, we invite you to read more about the NLU module directly on GitHub.

# 🔨 Adding NLU to our bot

## Creating the intents

For this tutorial, there are two user intents that we want to support: `play` and `see_leaderboard`. A real production bot would usually try to understand more things and be more complete, but for this tutorial this will be enough.

First, install the [`botpress-nlu`](https://github.com/botpress/botpress-nlu) module.

Once that's done, restart your bot. You should see a new "NLU" item in the left menu. Open it.

Click the "Create new intent" at the bottom and type `play`.

Now let's add a couple a new utterances (variations) of what a user would usually type if he wanted to say to the bot that he wants to play a new game. [[How do you do this?]] About 10 phrases should suffice to start. Don't forget to save the file once you're done.

Do the same for the `leaderboard` intent.

### Training the model

To train your bot using these new intents, simply restart the bot. You should see the training progress in the console.

![Training status in console][nluConsole]

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

We could very easily add a condition similar to the one below in entry point node of the bot so that if the user starts the conversation with something like "*Who's the best player?*", it would redirect him straight to the `leaderboard` flow.

![Final flow][nluFlow]

```js
event.nlu.intent.name === 'leaderboard'
// or
event.nlu.intent.is('leaderboard')
```

The latter example has the advantage of being case insensitive and is guaranteed to always be available by the NLU module, even if intent classification fails.

![Flowing to the leaderboard flow][nluLeaderboard]

[nluLeaderboard]: {{site.baseurl}}/images/nluLeaderboard.jpg
[nluConsole]: {{site.baseurl}}/images/nluConsole.jpg
[nluFlow]: {{site.baseurl}}/images/nluFlow.jpg
