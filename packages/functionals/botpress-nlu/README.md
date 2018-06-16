<img src='https://raw.githubusercontent.com/botpress/botpress/master/packages/functionals/botpress-nlu/assets/banner_demo.gif'>

# Botpress NLU ⚡

Botpress NLU is a Botpress module that adds NLU capatibilities to your bot by connecting to the NLU provider of your choice.

**🚧 I'm looking for help to support more providers**

| Provider | 🚩 Status |
| ------------- | :--------: |
| Native (built-in) | ✅ |
| [LUIS](https://www.luis.ai) | ✅ |
| [Dialogflow](https://dialogflow.com/) | Help needed |
| [RASA](https://github.com/RasaHQ/rasa_nlu) | ✅ |
| [Recast](https://recast.ai) | ✅ |

We believe NLP/NLU is a commodity, so this package abstracts the provider by providing a standard, clean interface that allows you (and the non-technicals) to easily edit the NLU data within Botpress.

With Botpress NLU,

- You own your data
- You can seamlessly switch to another NLP provider
- _(soon)_ You can continously train your bot on misunderstood phrases
- _(soon)_ You can share and import open-source, community-curated intents & entities

# Installation

⚠️ **This module only works with the upcoming [Botpress X](https://github.com/botpress/botpress/tree/develop/x).**

- Install the module `yarn add @botpress/nlu`
- Configure a provider (see below)

# Usage

1. You need to chose a Provider (currently `dialogflow`, `luis`, `rasa`, `recast` or `native`)
2. Set the `provider` config
3. Configure the provider

# Global Configuration [(source)](https://github.com/botpress/botpress/blob/master/packages/functionals/botpress-nlu/src/index.js#L19-L58)

| Key | Environment Variable | Required | Default |
| ------------- | -------- | ----- | ---- |
| provider | `NLU_PROVIDER` | Yes* | `native` |
| intentsDir | `NLU_INTENTS_DIR` | Yes | `./intents` |
| entitiesDir | `NLU_ENTITIES_DIR` | Yes | `./entities` |

> **'*'**: Provider is one of `dialogflow`, `rasa`, `luis`, `recast` or `native`

# Standard NLU Object (`event.nlu`)

Botpress NLU will instrument incoming events by providing a standardized object with the structure below.

| Path | Description | Supported by |
| ---- | ----------- | ---- |
| `nlu.intent` | Best classified intent based on confidence (same structure as below) | Dialogflow, LUIS, Rasa, Recast |
| `nlu.intents[i].name` | The name of the classified intent | LUIS, Rasa, Recast |
| `nlu.intents[i].confidence` | Confidence of the classification, between `0` and `1`, higher the better | LUIS, Rasa, Recast |
| `nlu.intents[i].provider` | The provider that provided the classification | * |
| `nlu.entities[i].name` | The name of the extracted entitiy | Dialogflow |
| `nlu.entities[i].type` | The type of entity that was extracted | LUIS, Rasa, Recast |
| `nlu.entities[i].value` | The **normalized** value of the extracted entity | Dialogflow, LUIS, Rasa |
| `nlu.entities[i].original` | The original (raw) value of the extracted entity | Rasa, Recast |
| `nlu.entities[i].confidence` | Confidence of the extraction, between `0` and `1` | LUIS, Recast |
| `nlu.entities[i].provider` | The provider that extracted the entity | * |
| `nlu.entities[i].position` | The position where it was found in the input string (start position) | LUIS, Rasa |
| `nlu.sentiment` | TBD | Recast |
| `nlu.language` | TBD | Recast |

Botpress NLU also provides two convenient methods to the NLU Object : `nlu.intent.is(intentName)` and `nlu.intents.has(intentName)`.

# Providers – Features Matrix

| Provider | Synchronization | Intent Classification | Entity Extraction | Scopes (*coming soon*) |
| ----- | :-----: | :-----: | :-----: | :-----: |
| Dialogflow | ❌ | ✅ | ✅ | ❌ |
| LUIS | ✅ | ✅ | ✅ | ❌ |
| RASA | ✅ | ✅ | ✅ | ❌ |
| Recast | ✅ | ✅ | ✅ | ❌ |
| Native | ✅ | ✅ | ❌ | ❌ |

## DIALOGFLOW

Botpress NLU use the V2 API of Dialogflow, checkout this [link](https://dialogflow.com/docs/reference/v2-agent-setup) for more information.

### Dialogflow Specific Configuration [(source)](https://github.com/botpress/botpress/blob/master/packages/functionals/botpress-nlu/src/index.js#L26-27)

| Key | Environment Variable | Required |
| ------------- | -------- | ----- |
| googleProjectId | `GOOGLE_PROJECT_ID` | Yes |
| https://cloud.google.com/docs/authentication/getting-started | `GOOGLE_APPLICATION_CREDENTIALS` | Yes |

## LUIS

### LUIS Specific Configuration [(source)](https://github.com/botpress/botpress/blob/master/packages/functionals/botpress-nlu/src/index.js#L29-L33)

| Key | Environment Variable | Required |
| ------------- | -------- | ----- |
| luisAppId | `NLU_LUIS_APP_ID` | Yes |
| [luisProgrammaticKey](https://docs.microsoft.com/en-us/azure/cognitive-services/luis/manage-keys) | `NLU_LUIS_PROGRAMMATIC_KEY` | Yes |
| luisAppSecret | `NLU_LUIS_APP_SECRET` | Yes |
| luisAppRegion | `NLU_LUIS_APP_REGION` | No (default is `westus`) |

### LUIS Caveats

There are some entities that LUIS doesn't support in some languages, make sure that the language you are using supports the entities you are using in Botpress (this module doesn't do this check for you).

### LUIS FAQ

<details>
  <summary><strong>I get an error when syncing my model</strong> <i>(click to see)</i></summary>
  Make sure that:
  
  - You have enough labels (min 2) for the intent
  - The entities you are using are supported by your app's language
</details>

## RASA

Botpress NLU will create and train and maintain your projects and models automatically for you. 

> **Note:** By default, Botpress creates separate projects for development and production environment, e.g. `dev__botpress__all` and `prod__botpress__all`.

### Rasa Specific Configuration [(source)](https://github.com/botpress/botpress/blob/master/packages/functionals/botpress-nlu/src/index.js#L35-L38)

| Key | Environment Variable | Required |
| ------------- | -------- | ----- |
| rasaEndpoint | `NLU_RASA_URL` | No (default is `http://localhost:5000/`) |
| rasaToken | `NLU_RASA_TOKEN` | No (none by default) |
| rasaProject | `NLU_RASA_PROJECT` | No (default is `botpress`) |

## RECAST

### Recast Specific Configuration [(source)](https://github.com/botpress/botpress/blob/master/packages/functionals/botpress-nlu/src/index.js#L40-L43)

| Key | Environment Variable | Required |
| ------------- | -------- | ----- |
| recastToken | `NLU_RECAST_TOKEN` | Yes |
| recastUserSlug | `NLU_RECAST_USER_SLUG` | Yes |
| recastBotSlug | `NLU_RECAST_BOT_SLUG` | Yes |

# Contributing

The best way to help right now is by helping with the exising issues here on GitHub and by reporting new issues!

# License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way please see the <a href="https://botpress.io/faq">FAQS</a>.
