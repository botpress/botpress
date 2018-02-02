---
layout: guide
---

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
<img src="https://rawgit.com/botpress/botpress/master/assets/content-bank.png" height="200px"/>

Using the interface, you can:
- See the list of **categories** (left panel)
- Create, view, delete and edit the **elements** for a particular category
- Search (filter) elements
- Export & import elements

In order to do that, you must first programmatically create a **Category**.

## Creating a Category <a class="toc" id="toc-creating-a-category" href="#toc-creating-a-category"></a>

### Creating Forms <a class="toc" id="toc-creating-forms" href="#toc-creating-forms"></a>


All forms must be located inside a single directory (see the [`botfile.js`](/docs/foundamentals/botfile) -> [`formsDir`](https://github.com/botpress/botpress/blob/master/src/cli/templates/init/botfile.js#L21) variable) and be suffixed with `.form.js`. For example, if your `formsDir` is `./forms`, then you might create a trivia category by creating the `./forms/trivia.form.js`.

### `*.form.js` Files Structure <a class="toc" id="toc-form-js-files-structure" href="#toc-form-js-files-structure"></a>

Your file must export an object with the following properties:

```js
{
  id: 'trivia', // string, mandatory
  title: 'Trivia Questions', // string, mandatory
  jsonSchema: {}, // Object, mandatory

  ummBloc: '#trivia-question', // string, optional
  uiSchema: {}, // object, optional
  computeData: function() {}, // function, optional
  computePreviewText: function() {}, // function, optional
  computeMetadata: function() {} // function, optional
}
```

#### Field `id` (**Required**) <a class="toc" id="toc-field-id-required" href="#toc-field-id-required"></a>

This is the formal programmatic name you give the category. The id should contain only alphanumeric characters and contain no spaces and no special characters. The id may contain hypens (`-`) and underscored (`_`).


#### Field `title` (**Required**) <a class="toc" id="toc-field-title-required" href="#toc-field-title-required"></a>


The title of the category as it will show in the UI (left side panel).


#### Field [`jsonSchema`](https://github.com/mozilla-services/react-jsonschema-form) (**Required**) <a class="toc" id="toc-field-jsonschema-https-github-com-mozilla-services-react-jsonschema-form-required" href="#toc-field-jsonschema-https-github-com-mozilla-services-react-jsonschema-form-required"></a>


The content manager uses the [JSON Schema](https://mozilla-services.github.io/react-jsonschema-form/) standard to power the forms. The `jsonSchema` property is just using `react-jsonschema-form` and passing it as the `schema` property.

> **Note**
>
> You should read the documentation of **[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)** to see all supported types of input.

#### Field [`uiSchema`](https://github.com/mozilla-services/react-jsonschema-form) (_Optional_)

The content manager uses the [JSON Schema](https://mozilla-services.github.io/react-jsonschema-form/) standard to power the forms. The `uiSchema` property is just using `react-jsonschema-form` and passing it as the `uiSchema` property.

[Link to `react-jsonschema-form`](https://github.com/mozilla-services/react-jsonschema-form)


#### Field `renderer` (_Optional_) <a class="toc" id="toc-field-uischema-https-github-com-mozilla-services-react-jsonschema-form-optional" href="#toc-field-uischema-https-github-com-mozilla-services-react-jsonschema-form-optional"></a>


Optionally, you can assign a UMM bloc to a content category. When doing so, Botpress will generate a virtual bloc (starting by `#!`) which you can use to send a message directly.

For example, if you have a category called `trivia`, generating trivia questions (content) would generate blocs that look like `#!trivia-h73k41`, which you can use anywhere as a regular UMM bloc (e.g. `event.reply('#!trivia-h73k41')`).

#### Field `computeData(data, computeDataHelper) -> Object|Promise<Object>` (_Optional_) <a class="toc" id="toc-field-ummbloc-optional" href="#toc-field-ummbloc-optional"></a>


Optionally, you can transform the raw data coming from the form, so that you can persist that manipulated version of it.

If you provide `computeData`, Botpress will use it to manipulate the data, and that modified data will be used by the UMM engine (if using `ummBloc`).

The second argument to the function, `computeDataHelper`, is an async function `async computeDataHelper(categoryId, contentItem)` that you can use if you want to call the `computeData` on the content from another category. It's mostly useful when used with the **Content Refs** (see below).

##### Example A (Trivia) <a class="toc" id="toc-field-computedata-data-object-promise-optional" href="#toc-field-computedata-data-object-promise-optional"></a>


```js
const _ = require('lodash')
// ...

computeData: formData => {
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
computeData: data => {
  return {
    full_name: data.first_name + ' ' + data.last_name
  }
}
```

#### Field `computePreviewText(data, computePreviewTextHelper) -> string|Promise<string>` (_Optional_)

Optionally, you can modify the Preview text used in the Content Manager GUI view.

The second argument to the function, `computePreviewTextHelper`, is an async function `async computePreviewTextHelper(categoryId, contentItem)` that you can use if you want to call the `computePreviewTextHelper` on the content from another category. It's mostly useful when used with the **Content Refs** (see below).

##### Example (Trivia)

```js
computePreviewText: formData => 'Question: ' + formData.question
```

#### Field `computeMetadata(data, computeMetadataHelper) -> Array<string>|Promise<Array<string>>` (_Optional_)

Optionally, you can generate Metadata for content, which can be used to search content in the UI

The second argument to the function, `computeMetadataHelper`, is an async function `async computeMetadataHelper(categoryId, contentItem)` that you can use if you want to call the `computeMetadataHelper` on the content from another category. It's mostly useful when used with the **Content Refs** (see below).

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

### Full Example (Trivia) <a class="toc" id="toc-full-example-trivia" href="#toc-full-example-trivia"></a>

#### `/content/trivia.form.js`
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

  computeData: formData => {
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

#### `index.js`
```js
const _ = require('lodash')

module.exports = function(bp) {

  // register UMM blocs

  bp.umm.registerBloc('#welcome', () =>
    'Welcome! Please use the menu to try out the different features.'
  )

  bp.umm.registerBloc('#fallback', () =>
    "Sorry I don't understand"
  )

  bp.umm.registerBloc('#trivia-question', ({ question, choices }) => ({
    text: question,
    quick_replies: choices.map(({ payload, text }) =>
      `<${payload}> ${text}`)
  }))

  bp.umm.registerBloc('#trivia-good', () => _.sample([
    'Yay! Good answer',
    'You rock!',
    'Good answer!'
  ]))

  bp.umm.registerBloc('#trivia-bad', () => _.sample([
    'Nope',
    "You're not good",
    "That's not the right answer..",
    'Not exactly what I expected of you'
  ])

  // your bot logic

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

## Advanced Topics

### Content Refs

Botpress Content Manager supports a custom (spec-compatible) extension that allows one content type (and the instances of this type) to reference other content type instances.

This feature is supported both internally and in the Content Manager GUI tool described above.

Let's see how you can leverage it to keep your content DRY and reusable.

### JSON Schema Extension

To define that a given field should be treated as a reference to an instance of another content type, you define the field as `string` with two mandatory extra atributes: `"$subtype": "ref"`, and `$category` which should be the ID of the referenced category.

It's best seen in the example. Continuing the *Trivia* example from the previous sections, let's define the new *Trivia Collection* type:

#### `trivia-collection.form.js`
```js
module.exports = {
  id: 'trivia-collection',
  title: 'Trivia Questions Collection',
  ummBloc: '#trivia-collection',

  jsonSchema: {
    title: 'Trivia Collection',
    description: 'Create a new Trivia Collection by combining existing questions',
    type: 'array',
    items: {
      type: 'string',
      $subtype: 'ref',
      $category: 'trivia'
    }
  },

  //...
}
```

It should now become clear that the instance of this type contains an array of *references* to some elements from the *trivia* category.

### JSON Data Extension

As we see the base type for the references is *string*. How are these references stored physically when serialized to the JSON file?

Here's an example:

#### `trivia-collection.json`
```json
[
  {
    "id": "trivia-collection-G2WkeH",
    "formData": ["##ref(trivia-question-aFCAIs)", "##ref(trivia-question-9l9hH~)"],
    "createdBy": "admin",
    "createdOn": "2018-01-23T21:28:41.676Z"
  },
  {
    "id": "trivia-collection-AxRaw~",
    "formData": ["##ref(trivia-question-8CXNiN)"],
    "createdBy": "admin",
    "createdOn": "2018-01-23T21:30:47.388Z"
  }
]
```

So, as you can see, these strings have the special form, `##ref(REFERENCED_CONTENT_ID)`. If you like editing your content JSON files by hand it can be handy to remember this format.

### Content Refs Resolution

Internally when the content item is requested by the bot engine (from the botpress API) the Content Manager engine finds the refs (following the format escribed above) and replaces the ref-strings with the actual content corresponding to the `REFERENCED_CONTENT_ID`.

> Essentially this means that your bot-related code (like your UMM blocs) gets the full content with references resolved.

**If the referenced content is not found it will cause the runtime error (just like when you try to fetch the data from the DB engine using the non-existent ID).**

### `compute*` helper methods

When dealing with content refs you may want to keep your custom `computeData`, `computePreviewText`, and `computeMetadata` methods DRY. How can one reuse these methods defined in another content type form definition?

To aid this task Botpress provides you with the helper methods passed as the 2nd arguments to your function. It's best illustrated with the example:

#### `trivia.form.js`
```js
const _ = require('lodash')

module.exports = {
  id: 'trivia',
  // ...

  computeData: formData => {
    const good = { payload: 'TRIVIA_GOOD', text: formData.good }
    const bad = formData.bad.map(i => ({ payload: 'TRIVIA_BAD', text: i }))
    const choices = [good, ...bad]

    return {
      question: formData.question,
      choices: _.shuffle(choices)
    }
  },

  computePreviewText: formData => 'Q: ' + formData.question
}
```

#### `trivia-collection.form.js`
```js
const Promise = require('bluebird')

module.exports = {
  id: 'trivia-collection',
  // ...

  computeData: (formData, computeDataHelper) => Promise.map(formData, computeDataHelper.bind(null, 'trivia')),
  computePreviewText: async (formData, computePreviewTextHelper) => {
    const triviaPreviews = await Promise.map(formData, computePreviewTextHelper.bind(null, 'trivia'))
    return `Trivia Collection [${triviaPreviews.join(', ')}]`
  }
}
```

As you can see from this example, our *Trivia Collection*'s methods are delegating to the corresponding methods defined in the *Trivia* form definition file, using the helper methods bound to the first argument being `trivia` (the ID of the *Trivia* content type).
