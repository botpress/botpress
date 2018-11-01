# Botpress Q&A ⚡

Botpress Q&A is a Botpress module that adds the unified Q&A management interface to your bot admin panel.

It either relies on the NLU module or on [Microsoft QnA Maker](https://www.qnamaker.ai) for recognizing the questions. By default it also uses the `builtins` module to send the text response, but it's configurable (see below).

# Installation

⚠️ **This module only works with the new [Botpress X](https://github.com/botpress/botpress).**

- Install the peer dependencies and the module iteslf `yarn add @botpress/builtins @botpress/nlu @botpress/qna` (note: you can skip the `builtins` module if you use the custom text renderer.)
- Configure [NLU](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-nlu#botpress-nlu-) or register at [Microsoft QnA Maker](https://www.qnamaker.ai) and provide the API key for it

# Configuration

The following properties can be configured either in the `qna.json` file or using the environment variables:

| Key | Environment Variable | Required | Default | |
| ------------- | -------- | ----- | ---- | ---- |
| `qnaDir` | `QNA_DIR` | No | `./qna` | The directory where the Q&A data is stored.
| `textRenderer` | `QNA_TEXT_RENDERER` | No | `#builtin_text` (requires `@botpress/builtins` to be installed) | The _renderer_ used to format the text responses.
| `exportCsvEncoding` | `QNA_EXPORT_CSV_ENCODING` | No | `utf8` | Encoding for CSV that can be exported from Q&A module
| `qnaMakerApiKey` | `QNA_MAKER_API_KEY` | No | | API-key for [Microsoft QnA Maker](https://www.qnamaker.ai). If provided QnA maker gets used to save items and search through them (instead of NLU-module)
| `qnaMakerKnowledgebase` | `QNA_MAKER_KNOWLEDGEBASE` | No | `botpress` | Name of the QnA Maker knowledgebase to use

# Usage

Go to the bot admin panel and choose Q&A from the left hand side menu.

This opens Q&A module's page that allows you to manage questions. You can:

- create new questions by filling in the form at the top
- edit existing questions by changing appropriate fields of their forms
- remove or disable questions by either clicking "Remove" button or changing "Enabled" checkbox
- filter questions via search-input

Each questions can be associated either with text-answer (by default it'll use `#builtin_text` renderer to send it) or with redirect to another flow node. You can specify behavior via "Reply with" radio-button.

Qna-package adds middleware that listens to user's messages and if they match an intent of the question it either responds with an answer, or redirects to some flow-node.

## Programmatic usage

`botpress-qna` exposes public API for importing/exporting questions: `bp.qna.import` and `bp.qna.export`.
See examples below on how to use them.

```js
// Importing questions provided as an array of objects
const questions = [
  { questions: ['Question1', 'Question2'], action: 'text', answer: 'Answer1' },
  { questions: ['Question3'], action: 'redirect', answer: 'main.flow.json#some-node' }
]
await bp.qna.import(questions)

// Importing questions from json-string
const questionsJson = `[
  { "questions": [ "Question1", "Question2" ], "action": "text", "answer": "Answer1" },
  { "questions": [ "Question3" ], "action": "redirect", "answer": "main.flow.json#some-node" }
]`
await bp.qna.import(questions, { format: 'json' })

// Importing questions from csv-string
// Note: consequtive questions with similar answer will be merged into one record with multiple questions
const questionsCsv = 
`"Question1","text","Answer1"
"Question2","text","Answer1"
"Question3","redirect","main.flow.json#some-node"`
await bp.qna.import(questions, { format: 'csv' })
```

```js
const questionsExported = await bp.qna.export() // Should return structure similar to "questions" const in previous example

const questionsFlatExported = await bp.qna.export({ flat: true })
// Should return a flat structure with question-string in each record like this (might be useful for exporting to CSV):
// 
// [
//   { question: 'Question1', action: 'text', answer: 'Answer1' },
//   { question: 'Question2', action: 'text', answer: 'Answer1' },
//   { question: 'Question3', action: 'redirect', answer: 'main.flow.json#some-node' }
// ]
```

```js
const answers = await bp.qna.answersOn('How can I reach you out?')
// [ { questions: [ 'How can I reach you out?' ],
//     answer: 'You could find us on Facebook!',
//     id: 116,
//     confidence: 100,
//     enabled: true,
//     action: 'text' } ]
```

## Controlling if Q&A should intercept

It may appear that it's not useful for Q&A to just intercept all the users' messages and try to match them against Q&A's intents. This can be customized by providing a hook to Q&A module that will prevent interception when returning `false` or a promise resolving to `false`.

The hook is a function accepting `event` and `state` parameters:

```js
bp.qna.shouldProcessMessage((event, state) => Promise.resolve(false))
bp.qna.shouldProcessMessage(async (event, state) => state.qnaEnabled) // It's also possible to use an async-function
```

# Contributing

The best way to help right now is by helping with the exising issues here on GitHub and by reporting new issues!

# License

Botpress is dual-licensed under [AGPLv3](/licenses/LICENSE_AGPL3) and the [Botpress Proprietary License](/licenses/LICENSE_BOTPRESS).

By default, any bot created with Botpress is licensed under AGPLv3, but you may change to the Botpress License from within your bot's web interface in a few clicks.

For more information about how the dual-license works and why it works that way please see the <a href="https://botpress.io/faq">FAQS</a>.

