# Content Manager

The Official Content Manager of Botpress have built on top of the popular library **[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)**.

## How it works

### Developers

To be able to use the Content Manager, developers need to setup the different form by code.

1. Need to create a `${NAME}.form.js` for each form the content manager will need.
2. Add them at the right place. Each `*.form.js` file should be place in the directory `./content/forms` of your bot.
3. Test each form using the UI to be sure they work well.
4. Add content to the right place in the flows.

### Content managers

The Content Manager interface offers different functionnalities. You can **add**, **modify** **delete**, **select**, **import** and **export** content by using the interface.

<img src="https://rawgit.com/botpress/botpress/dfs-content/assets/content-view.png" height="200px">

## How to create forms

By using a JSON schema you can create all different kind of form you will need to generate new content. Here's an example of form you can create. 

<img src="https://rawgit.com/botpress/botpress/dfs-content/assets/content-form.png" height="200px">

#### Partial section of `trivia.form.js`

```js
  [...]

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
  }

  [...]
```

> **Note**
> 
> You should look to the specific documentation of **[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)** to see all supported type of input.

## How to use in the flows

To add generated content to the flow, you need to get the `id` (by **code** or in the **UI**) of the content. 

```js
  bp.hear(/^question$/i, (event, next) => {
    event.reply('#!trivia-150eea')
  })
```

Here's an example of how you can get the `ids` by code from a list and how to select a random one. 

```js
  bp.hear(/^question$/i, (event, next) => {
    bp.contentManager.listCategoryItems('trivia')
    .then(items => {
      const random = _.first(_.shuffle(items))  
      event.reply('#!' + random.id)
    })
  })
```

> **Important**
> 
> You need to use `#!` instead of `#` to select dynamic content. 


## Full example

We implemented a full example for simple trivia question interactions. 

#### `content.yml`
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


#### `index.js`
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

#### `/content/form/trivia.form.js`

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

## Credits

Thanks to **[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)**.