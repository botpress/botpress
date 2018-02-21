---
layout: guide
---

# 📚 NLU

A tutorial wouldn't be complete without talking about NLU.

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
- **User said:** *"Can I bring a pet abroad?"* , **Intent:** `faq_pet`

Intent classification is in general a better way than using keywords to understand what the user is trying to say.

## Entity Extraction

Entity Extraction helps you extract and normalize known entities from phrases. Examples:
- **User said:** *"I want to fly to Dubai tomorrow"* , **Destination:** `Dubai` , **Date:** `01 Jan 2018` 

Entity Extraction is usually used in combination with Intent Classification.

# 🔨 Adding NLU to our bot

## Getting user intent
