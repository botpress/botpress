---
id: version-11.7.1-webchat-embedding
title: Embedding your bot on your website
original_id: webchat-embedding
---

Embedding a bot to your existing site is quite straightforward. You will need to deploy your bot to a server or hosting provider and make it accessible via a URL. You will then be able to add the following script tag to the end of your `index.html` page.

NB: Remember to replace <your-url-here> with the URL of your bot!

```html
<script src="<your-url-here>/assets/modules/channel-web/inject.js"></script>
```

After the import script above you need to initialize the bot to the `window` object with the script below.

```html
<script>
  window.botpressWebChat.init({ host: '<your-url-here>', botId: '<your-bot-id>' })
</script>
```

And that's it! Once you deploy the changes to your website, the bot will become available, and its button will appear.

There is an example included in the default botpress installation at `http://localhost:3000/assets/modules/channel-web/examples/embedded-webchat.html`

## How to display a Bot Information page

The information page displays informations like the website url, a phone number, an e-mail contact address, and links to terms of services and privacy policies. You can also include a cover picture and an avatar for your bot.

How to set up the information page:

1. On the Admin UI, click on the link `Config` next to the name of the bot you want to change.
2. Edit your bot informations in the `More details` and `Pictures` sections.
3. Edit the file `data/global/config/channel-web.json` and set `showBotInfoPage` to `true` \*\*
4. Refresh your browser.

You will see the page when starting a new conversation. The page is always accessible by clicking on the information icon in the top right corner of the chat window.

\*\* We edited the `global` configuration file for the sake of simplicity. To enable the bot information page on a single bot, you will need to copy the file `data/global/config/channel-web.json` to your bot folder `data/bots/BOT_NAME/config/channel-web.json` and edit that file.

## Customizing the look and feel of the Webchat

The Webchat view is customizable by passing additional params to the `init` function, below are the options available:

```js
window.botpressWebChat.init({
  host: '<host>',
  botId: '<botId>', //The ID for your bot
  botName: 'Bot', // Name of your bot
  botAvatarUrl: null, // Default avatar URL of the image (e.g., 'https://avatars3.githubusercontent.com/u/1315508?v=4&s=400' )
  botConvoTitle: 'Technical Support', // Title of the first conversation with the bot
  botConvoDescription: '',
  backgroundColor: '#ffffff', // Color of the background
  textColorOnBackground: '#666666', // Color of the text on the background
  foregroundColor: '#0176ff', // Element background color (header, composer, button..)
  textColorOnForeground: '#ffffff', // Element text color (header, composer, button..)
  showConversationsButton: true, // Whether or not to show the conversations button
  showUserName: false, // Whether or not to show the user's name
  showUserAvatar: false, // Whether or not to show the user's avatar
  enableTranscriptDownload: false, // Whether or not to show the transcript download button
  enableArrowNavigation: false, //Whether or to to support arrow navigation (e.g scroll conversation, focus on buttons)
  externalAuthToken: 'my jwt token', // Defines a token that is sent with each messages to Botpress
  userId: null, // Allows you to override the default user id. Make sure it is not possible to guess it!
  extraStylesheet: '/assets/modules/channel-web/examples/my-theme.css' // Define a custom style sheet to override Botpress styling
})
```

There is an example on how to customize the web chat with your custom CSS bundled with your default Botpress installation. Start the server, then head over to `http://localhost:3000/assets/modules/channel-web/examples/styled-webchat.html` for an example.

## Advanced

### Displaying and hiding the webchat programmatically from the website

If the default Botpress button doesn't work for you, it can be changed by adding a `click` event listener to any element on the page. You will also need to pass the `hideWidget` key to your `init` function like this:

```html
<script>
  window.botpressWebChat.init({ host: '<your-url-here>', botId: '<your-bot-id>' hideWidget: true })
</script>
```

Here is some sample code for adding the event listeners to your custom elements:

```html
<script>
  document.getElementById('show-bp').addEventListener('click', () => {
    window.botpressWebChat.sendEvent({ type: 'show' })
  })
  document.getElementById('hide-bp').addEventListener('click', () => {
    window.botpressWebChat.sendEvent({ type: 'hide' })
  })
</script>
```

### Obtaining the User ID of your visitor

It may be useful to fetch the current visitor ID to either save it in your database or to update some attributes in the Botpress DB.

Since the webchat is running in an iframe, communication between frames is done by posting messages.
The chat will dispatch an event when the user id is set, which you can listen for on your own page.

```js
window.addEventListener('message', message => {
  if (message.data.userId) {
    console.log(`The User ID is ` + message.data.userId)
  }
})
```

### Configuring the Webchat during a conversation

The method `window.botpressWebChat.configure` allows you to change the configuration of the chat during a conversation without having to reload the page
