# Content Manager

<img src='https://s3.amazonaws.com/botpress-io/images/screenshot-ui.png'>

## How it works



## Customizable forms



## Full example

We implemented a full example for simple trivia question interactions.

### `content.yml`
```yaml

welcome:
  - Welcome! Please use the menu to try out the different features.

fallback:
  - Sorry I don't understand

trivia-question:
  - text: "{{{question}}}"
    quick_replies:
      {{#choices}}
      - "<{{payload}}> {{{text}}}"
      {{/choices}}

trivia-good:
  - text:
    - Yay! Good answer :)
    - You rock!
    - Good answer!

trivia-bad:
  - text:
    - Nope
    - You're not good
    - That's not the right answer..
    - Not exactly what I expected of you
```


### `index.js`
```js
const _ = require('lodash')

module.exports = function(bp) {  
  
  bp.hear(/GET_STARTED|hello|hi|test|hey|holla/i, (event, next) => {
    event.reply('#welcome') // See the file `content.yml` to see the block
  })

  bp.hear(/^question$/i, (event, next) => {
    bp.contentManager.listCategoryItems('trivia')
    .then(items => {
      const random = _.first(_.shuffle(items))  
      event.reply('#!' + random.id)
    })
  })

  bp.hear(/TRIVIA_GOOD/i, (event, next) => {
    event.reply('#trivia-good')
  })

  bp.hear(/TRIVIA_BAD/i, (event, next) => {
    event.reply('#trivia-bad')
  })

  bp.fallbackHandler = (event, next) => {
    if (event.type === 'message' || event.type === 'text') {
      event.reply('#fallback')
    }
  }
}
```



### `trivia.form.js`

```js
const _ = require('lodash')

module.exports = {
  id: 'trivia',
  title: 'Trivia Questions',
  ummBloc: '#trivia-question',

  jsonSchema: {
    "title": "Trivia Questions",
    "description": "Create a new Trivia question with up to 5 choices and only one correct answer",
    "type": "object",
    "required": [
      "question",
      "good",
      "bad"
    ],
    "properties": {
      "question": {
        "type": "string",
        "title": "Question"
      },
      "good": {
        "type": "string",
        "title": "Good answer"
      },
      "bad": {
        "title": "Bad Answers",
        "type": "array",
        "items": {
          "type": "string",
          "default": ""
        }
      }
    }
  },

  uiSchema: {
    "bad": {
      "ui:options": {
        "orderable": false
      }
    }
  },

  computeFormData: formData => {
    const good = { payload: 'TRIVIA_GOOD', text: formData.good }
    const bad = formData.bad.map(i => ({ payload: 'TRIVIA_BAD', text: i }))
    const choices = [good, ...bad]

    return {
      question: formData.question,
      choices: _.shuffle(choices)
    }
  },

  computePreviewText: formData => 'Q: ' + formData.question,
  computeMetadata: null
}
```