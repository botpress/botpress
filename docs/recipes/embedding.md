---
layout: guide
---

# Embedding the webchat on a website

Embedding a bot to your existing site is quite straightforward:

1. You need to have your bot deployed somewhere and available via some URL
2. You have to inject script from your bot to your website (e.g. by adding it to the end of it's `index.html` file like this:

```html
<script src="http://<your-url-here>/api/botpress-platform-webchat/inject.js"></script>
```

3. You have to init the bot by running something like this:

```html
<script>
  window.botpressWebChat.init({ host: 'http://<your-url-here>' })
</script>
```

That's it. Once you deploy changes to your website, the bot should become available, and its button should appear.

# Displaying and hiding the webchat programmatically from the website

If you find the default button Botpress suggests doesn't suit you, you are free to exchange it with basically anything on your website and trigger webchat programmatically. For this you need to pass `hideWidget` key to `init` function like this:

```html
<script>
  window.botpressWebChat.init({ host: 'http://<your-url-here>', hideWidget: true })
</script>
```

Then you can work with webchat programmatically like this:

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

# Changing the look and feel of the Webchat

Webchat view is customizable, and you can change it by passing additional params to `init` function:

```js
window.botpressWebChat.init({
  host: '<host>',
  botName: 'Bot', // Name of your bot
  botAvatarUrl: null, // Default avatar URL of the image (e.g., 'https://avatars3.githubusercontent.com/u/1315508?v=4&s=400' )
  botConvoTitle: 'Technical Support', // Title of the first conversation with the bot
  botConvoDescription: '',
  backgroundColor: '#ffffff', // Color of the background
  textColorOnBackground: '#666666', // Color of the text on the background
  foregroundColor: '#0176ff', // Element background color (header, composer, button..)
  textColorOnForeground: '#ffffff' // Element text color (header, composer, button..)
})
```
