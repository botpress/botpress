---
id: version-11.7.3-listen-file-changes
title: Listening for file changes
original_id: listen-file-changes
---

You may find yourself having to write custom logic when a Botpress file has been changed in Botpress. For example, you could listen for changes to the QnA files to automatically launch a translation worker to translate the QnA to multiple languages.

The Botpress File System (Ghost) exposes a way to listen for file changes for that purpose. In this example we will watch for NLU changes inside any bot.

### Example

Let's create a Hook inside the `<data_dir>/global/hooks/after_bot_mount` called `listen_nlu.js` and put the following code inside it:

```js
const listener = bp.ghost.forBot(botId).onFileChanged(file => {
  if (
    file.toLowerCase().startsWith(`data/bots/${botId}/intents/`) ||
    file.toLowerCase().startsWith(`data/bots/${botId}/entities/`)
  ) {
    bp.logger.info('NLU Data has changed: ' + file)
  }
})

setTimeout(() => {
  // Example of how to stop listening after 1m
  listener.remove()
}, 60 * 1000)
```
