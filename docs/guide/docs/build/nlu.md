---
id: nlu
title: NLU
---

## How it works

The Botpress NLU module will process every incoming messages and will perform Intent Classification, Entity Extraction and Language Identification. The structure data that these tasks provide is added to the message metadata directly (under `event.nlu`), ready to be consumed by the other modules and components.

## Intent Classification

Intent classification helps you detect the intent of the users. It is a better and more accurate way to understand what the user is trying to say than using keywords.

##### Examples

|              User said              |       Intent       | Confidence |
| :---------------------------------: | :----------------: | :--------: |
| _"I want to fly to Dubai tomorrow"_ |   search_flight    |    0.98    |
|   _"My flight is delayed, help!"_   | faq_flight_delayed |    0.82    |
|    _"Can I bring a pet aboard?"_    |      faq_pet       |    0.85    |

### Adding an intent

[TODO screenshot]

### Responding to an intent

[TODO screenshot]

### Confidence and debugging

[TODO screenshot]

## Entity Extraction

Entity Extraction helps you extract and normalize known entities from phrases.

##### Example

|              User said              | City  |    Date     |
| :---------------------------------: | :---: | :---------: |
| _"I want to fly to Dubai tomorrow"_ | Dubai | 01 Jan 2018 |

**TODO**: Documentation on how to configure entity extraction missing

## QnA

A simple use-case for bots is to understand a question and to provide an answer automatically. Doing that manually for all the questions and answers using the NLU module and the flow editor would be a tedious task, which is why we recommend using the QnA module for that instead.

## Providers

Botpress NLU ships with a native NLU engine (Botpress Native NLU) which doesn't have any external dependencies and doesn't hit the cloud. If, for some reason, you want to switch the NLU engine that Botpress will use to extract the information, you can do so by changing the NLU configuration file `data/global/config/nlu.json`.

##### Features by Providers

|  Provider  | Intent | Entity | Lang | Context |
| :--------: | :----: | :----: | :--: | :-----: |
|   Native   |   X    |        |  X   |         |
|    RASA    |   X    |   X    |      |         |
| DialogFlow |   X    |   X    |      |    X    |
|    LUIS    |   X    |   X    |      |         |
