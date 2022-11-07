---
id: content-carousel
title: Content - Carousel
---

--------------------

A carousel is an array of cards, that can be presented horizontally or vertically.

The carousel has the Postback feature, which allows you to send custom data to the Botpress server when the user clicks a button in the carousel. Using a hook, you can make your Botpress server act upon the received data.

## Example

When our chat user clicks on a button in the carousel, we send a payload with a city code (`mtl` [Montréal] or `nyc` [New York City]).

Then, we create a hook that saves this city code in the memory. The bot then flows to a particular node, depending on the value in memory.

As you can see, the bot first displays a carousel, then a different node based on the value of `temp.cityClicked`. The current transitions do not work yet, let's see the hook.

## Implementing the Hook

1. Access the Conversation Studio of the selected bot.
2. Click the **Code Editor** tab.
3. Next to the **Hooks** tab, click the **+** button.
4. In the dropdown menu, hover over **Event Hooks**, then click **After Incoming Middleware**.
5. Type the name of your hook.
:::note
Don't forget to add `.js` after the name you typed.
:::
6. Paste the following snippet inside your hook file:
```javascript
function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent) {
  /** Your code starts below */

  async function hook() {
    const backs = ['callback', 'postback']
    if (backs.includes(event.type)) {
      let payload = ''
      switch (event.type) {
        case 'callback': // For Facebook Messenger
          payload = event.payload.text
          break
        case 'postback': // For Web
          payload = event.payload.payload
      }

      switch (payload) {
        case 'mtl':
          event.state.temp.cityClicked = 'mtl'
          break
        case 'nyc':
          event.state.temp.cityClicked = 'nyc'
          break
        default:
          console.log('Unexpected payload')
      }
    }
  }

  return hook()

  /** Your code ends here */
}
```
7. Save by clicking the little disk at the bottom left.