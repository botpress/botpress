---
id: embedding
title: Embedding the Webchat on a website
---

Embedding a bot to your existing site is quite straightforward. You will need to deploy your bot to a server or hosting provider and make it accessible via a URL.

You will then be able to add the following script tag to the end of your `index.html` page.

NB: Remember to replace <your-url-here> with the URL of your bot!

```html
<script src="<your-url-here>/api/ext/channel-web/inject.js"></script>
```

After the import script above you need to initialize the bot to the `window` object with the script below.

```html
<script>
  window.botpressWebChat.init({ host: '<your-url-here>', botId: '<your-bot-id>' })
</script>
```

And that's it! Once you deploy the changes to your website, the bot will become available, and its button will appear.

# Displaying and hiding the webchat programmatically from the website

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

# Customizing the look and feel of the Webchat

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
  showUserName: false, // Whether or not to show the user's name
  showUserAvatar: false, // Whether or not to show the user's avatar
  enableTranscriptDownload: false // Whether or not to show the transcript download button
})
```
