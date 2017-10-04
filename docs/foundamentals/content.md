# Content Manager

## Overview

The built-in Content Manager allows your bot administrators to **add and edit content** on the fly, without any programming knowledge, after the bot has been deployed. Here are some use cases:

- Add and edit Trivia questions
- Add news & articles that will be sent to subscribers
- Change the location of the event for your Event bot
- Add and edit Frequently Asked Questions (FAQs)
- Add and edit items your bot is selling
- Allow people to customize your generic bot template

The Content Manager is essentially an automatic form generator.

<img src="https://rawgit.com/botpress/botpress/master/assets/content-preview.png" height="200px"/>
<img src="https://rawgit.com/botpress/botpress/master/assets/content-new.png" width="500px"/>
<img src="https://rawgit.com/botpress/botpress/master/assets/content-bank.png" width="500px"/>

Using the interface, you can:
- See the list of **categories** (left panel)
- Create, view, delete and edit the **elements** for a particular category
- Search (filter) elements
- Export & import elements

In order to do that, you must first programmatically create a **Category**.

## Creating a Category

### Creating Forms

All forms must be located inside a single directory (see the [`botfile.js`](./botfile.md) -> [`formsDir`](https://github.com/botpress/botpress/blob/master/src/cli/templates/init/botfile.js#L21) variable) and be suffixed with `.form.js`. For example, if your `formsDir` is `./forms`, then you might create a trivia category by creating the `./forms/trivia.form.js`.

### `*.form.js` Files Structure

Your file must export an object with the following properties:

```js
{
  id: 'trivia', // string, mandatory
  title: 'Trivia Questions', // string, mandatory
  jsonSchema: {}, // Object, mandatory

  ummBloc: '#trivia-question', // string, optional
  uiSchema: {}, // object, optional
  computeFormData: function() {}, // function, optional
  computePreviewText: function() {}, // function, optional
  computeMetadata: function() {} // function, optional
}
```

#### Field `id` (**Required**)

This is the formal programmatic name you give the category. The id should contain only alphanumeric characters and contain no spaces and no special characters. The id may contain hypens (`-`) and underscored (`_`).


#### Field `title` (**Required**)

The title of the category as it will show in the UI (left side panel).


#### Field [`jsonSchema`](https://github.com/mozilla-services/react-jsonschema-form) (**Required**)

The content manager uses the [JSON Schema](https://mozilla-services.github.io/react-jsonschema-form/) standard to power the forms. The `jsonSchema` property is just using `react-jsonschema-form` and passing it as the `schema` property.

> **Note**
> 
> You should read the documentation of **[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)** to see all supported types of input.

#### Field [`uiSchema`](https://github.com/mozilla-services/react-jsonschema-form) (_Optional_)

The content manager uses the [JSON Schema](https://mozilla-services.github.io/react-jsonschema-form/) standard to power the forms. The `uiSchema` property is just using `react-jsonschema-form` and passing it as the `uiSchema` property.

[Link to `react-jsonschema-form`](https://github.com/mozilla-services/react-jsonschema-form)


#### Field `ummBloc` (_Optional_)

Optionally, you can assign a UMM bloc to a content category. When doing so, Botpress will generate a virtual bloc (starting by `#!`) which you can use to send a message directly. 

For example, if you have a category called `trivia`, generating trivia questions (content) would generate blocs that look like `#!trivia-h73k41`, which you can use anywhere as a regular UMM bloc (e.g. `event.reply('#!trivia-h73k41')`).

#### Field `computeFormData(data) -> Object|Promise<Object>` (_Optional_)

Optionally, you can manipulate the raw data coming from the form, so that you can persist that manipulated version of it.

If you provide `computeFormData`, Botpress will use it to manipulate the data, and that modified data will be used by the UMM engine (if using `ummBloc`).

##### Example A (Trivia)

```js
const _ = require('lodash')
// ...

computeFormData: formData => {
  const good = { payload: 'TRIVIA_GOOD', text: formData.good }
  const bad = formData.bad.map(i => ({ payload: 'TRIVIA_BAD', text: i }))
  const choices = [good, ...bad]

  return {
    question: formData.question,
    choices: _.shuffle(choices)
  }
}
```

##### Example B

```js
computeFormData: data => {
  return {
    full_name: data.first_name + ' ' + data.last_name
  }
}
```

#### Field `computePreviewText(data) -> string|Promise<string>` (_Optional_)

Optionally, you can modify the Preview text in the UI view.

##### Example (Trivia)

```js
computePreviewText: formData => 'Question: ' + formData.question
``` 

#### Field `computeMetadata(data) -> Array<string>|Promise<Array<string>>` (_Optional_)

Optionally, you can generate Metadata for content, which can be used to search content in the UI

##### Example (Trivia)

```js
// Index the year so you can search by years
computeMetadata: formData => ['TRIVIA', new Date().getYear()]
```

### API (`bp.contentManager` [**Source**](https://github.com/botpress/botpress/blob/master/src/content/service.js))

#### `bp.contentManager.listAvailableCategories()` -> Array<Category>

```js
[{
  id: 'trivia',
  title: 'Trivia',
  description: 'List of trivia questions',
  count: 928
}]
```

#### `bp.contentManager.listCategoryItems(categoryId, [from=0], [count=50], [searchTerm])` -> Array<CategoryItem>

#### `bp.contentManager.getItem(itemId)` -> CategoryItem

#### `bp.contentManager.getItemsByMetadata(filterString)` -> Array<CategoryItem>

### Full Example (Trivia)

#### `/forms/trivia.form.js`
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
    event.reply('#welcome')
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
