# Botpress Webchat

This channel is a customizable web chat that can be:

* **Embedded** on any website
* Used as a **Standalone** full-screen chat

## Installation

```
yarn add @botpress/channel-web
```

## Supported messages (Work in progress)

[**⭐ See the full list of supported messages**](https://github.com/botpress/modules/blob/master/channels/botpress-channel-web/src/umm.js)

<details>
    <summary><b>Text</b></summary>

### Example

```js
'#text': data => [
    {
      on: 'webchat',
      typing: true,
      text: data.text,
      markdown: true
    }
]
```

#### `typing` (optional)

Can be `true` to use natural typing speed (based on characters length) or can also be a natural time string (parsed by [`ms module`](https://www.npmjs.com/package/ms)).

#### `markdown` (optional)

Can be `true` to render the text as markdown format. This allows you to include links, bold and italic text.

#### `web-style` (optional)

`web-style` (optional) will pass the arguments as [DOM style](https://www.w3schools.com/jsref/dom_obj_style.asp) properties. This allows you to customize how specific messages look.

```js
web-style: {
  color: "rgb(24, 1, 187)",
  borderLeft: "2px solid rgb(11, 8, 162)",
  padding: "10px",
  fontWeight: "600",
  fontSize: "20px",
  fontFamily: "'Lato', sans-serif" }
```

#### `quick_replies` (optional)

Array of string, with the `<PAYLOAD> Text` format.

```js
quick_replies: data.choices.map(choice => `<${choice.payload}> ${choice.text}`)
```

</details>

<details>
    <summary><b>Form</b></summary>

##### `content.yml`

```js
'#form': data => [
  {
    on: 'webchat',
    typing: true,
    markdown: true,
    text: data.text,
    form: {
      title: 'Survey',
      id: 'survey',
      elements: [
        {
          input: {
            label: 'Email',
            placeholder: 'Your email',
            name: 'email',
            subtype: 'email',
            required: true
          }
        },
        {
          textarea: {
            label: 'Text',
            placeholder: 'Your text',
            name: 'text',
            maxlength: 100,
            minlength: 2
          }
        }
      ]
    }
  }
]
```

It's look's like a usually web form. After submitted, you can handle this event with botpress.hear method. For example:

```js
bp.hear({ type: 'form', formId: 'survey' }, (event, next) => {
  // Your code
})
```

You can always catch formId in the hear function, because Id is not an option in the form element. You choose a value to go with your id keys.

```js
'#welcome': data => [
  {
    on: 'webchat',
    text: 'Welcome',
    typing: '250ms',
    form: {
      title: 'welcome',
      id: 'welcome',
      /* ... */
    }
  }
] 

'#form-email': data => [
  {
    on: 'webchat',
    text: 'Provide me your email',
    form: {
      title: 'Email',
      id: 'email',
      /* ... */
    }
  }
]
```

in your `bp.hear` function

```js
bp.hear({type:'form',formId:'welcome'},(event,next))=> {} // welcome content
bp.hear({type:'form',formId:'email'},(event,next))=> {} // form-email content
```

###### Form Elements

`input`

Has next attributes: label, name, placeholder, subtype, required, maxlength, minlength, which works like a same attributes in html5 (`subtype` is a same as `type` in html5)

`textarea`

Has a same attributes like `input`, but has no `subtype` attribute

`select`

Has a same attributes like `textarea`, but has no `maxlength` and `minlength` attributes, and has `options` attribute, which contain an option elements.

Example:

```js
{
  select: {
    label: 'Select one item',
    name: 'select',
    placeholder: 'Select one option',
    options: [
      {
        option: {
          label: 'Hindu (Indian) vegetarian',
          value: 'hindu'
        }
      },
      {
        option: {
          label: 'Strict vegan',
          value: 'vegan'
        }
      },
      {
        option: {
          label: 'Kosher',
          value: 'kosher'
        }
      },
      {
        option: {
          label: 'Just put it in a burrito',
          value: 'burrito'
        }
      }
    ]
  }
}
```

</details>

<details>
    <summary><b>Carousel</b></summary>

#### `elements` (required)

Array of `element` objects

#### `element.title` (required)

String

#### `element.picture` (optional)

String (URL)

#### `element.subtitle` (optional)

String

#### `element.buttons` (optional)

Object | `{ url: 'string', title: 'string', text: 'string', payload: 'string' }`
When provided with `payload` instead of `url`, acts similarly to quick replies.

#### `settings` (optional)

Settings to pass the [`react-slick`](https://github.com/akiran/react-slick) component

</details>

---

## Using it as Standalone (full-screen)

In your `index.js` file, add this:

```js
const config = {
  botName: '<<REPLACE>>',
  botAvatarUrl: '<<REPLACE BY URL>>',
  botConvoTitle: '<<REPLACE>>',
  botConvoDescription: '<<REPLACE>>',
  backgroundColor: '#ffffff',
  textColorOnBackground: '#666666',
  foregroundColor: '#000000',
  textColorOnForeground: '#ffffff'
}

bp.createShortlink('chat', '/lite', {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({ config: config })
})
```

**Now your bot is available at the following url: `<BOT_URL>/s/chat`, e.g. `http://localhost:3000/s/chat`.**

This **URL is public** (no authentication required) so you can share it we other people.

## Using it as Embedded (on website)

To embedded the web interface to a website, you simply need to add this script at the end of the `<body>` tag. Don't forget to set the `host` correctly to match the public hostname of your bot.

```html
<script src="<host>/api/channel-web/inject.js"></script>
<script>window.botpressWebChat.init({ host: '<host>' })</script>
```

## Customize the look and feel

You can customize look and feel of the web chat by passing additional keys to `init` method like this:

```javascript
window.botpressWebChat.init({
  host: '<host>',
  botName: 'Bot', // Name of your bot
  botAvatarUrl: null, // Default avatar url of the image (e.g. 'https://avatars3.githubusercontent.com/u/1315508?v=4&s=400' )
  botConvoTitle: 'Technical Support', // Title of the first conversation with the bot
  botConvoDescription: '',
  backgroundColor: '#ffffff', // Color of the background
  textColorOnBackground: '#666666', // Color of the text on the background
  foregroundColor: '#0176ff', // Element background color (header, composer, button..)
  textColorOnForeground: '#ffffff' // Element text color (header, composer, button..)
})
```

You can also use `window.botpressWebChat.configure` method to modify web chat options after it's initialized.

### Page –> Bot interractions

You can open/close sidebar programmatically by calling `window.botpressWebChat.sendEvent` with `{ type: 'show' }` or `{ type: 'hide' }`.

## Configuring file uploads

A configuration file has been created in the `config` directory of your bot when you installed the module. You can change these values to set up S3 integration.
