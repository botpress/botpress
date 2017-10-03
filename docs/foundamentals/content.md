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
<img src="https://rawgit.com/botpress/botpress/master/assets/content-new.png" height="200px"/>

Using the interface, you can:
- See the list of **categories** (left panel)
- Create, view, delete and edit the **elements** for a particular category
- Search (filter) elements
- Export & import elements

In order to do that, you must first programmatically create a **Category**.

## Creating a Category

### Forms Directory

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

[Link to `react-jsonschema-form`](https://github.com/mozilla-services/react-jsonschema-form)


#### Field [`uiSchema`](https://github.com/mozilla-services/react-jsonschema-form) (**Required**)

The content manager uses the [JSON Schema](https://mozilla-services.github.io/react-jsonschema-form/) standard to power the forms. The `uiSchema` property is just using `react-jsonschema-form` and passing it as the `uiSchema` property.

[Link to `react-jsonschema-form`](https://github.com/mozilla-services/react-jsonschema-form)


#### Field `ummBloc`


