---
layout: guide
---

Webchat carousel is a useful way of showing collection of elements. Let's check advanced carousel-renderer and comments to it:

```js
{
  on: 'webchat',
  type: 'carousel',
  typing: '1s',
  text: 'Elements',
  settings: {
    // This specifies number of slides to be shown depending on resolution
    responsive: [
      { breakpoint: 400, settings: { slidesToShow: 1 } },
      { breakpoint: 750, settings: { slidesToShow: 3 } }
    ]
  },
  'web-style': { direction: 'rtl' }, // This allows to add custom CSS-styling
  elements: [{
    title: 'External document',
    subtitle: 'This is a link to external document',
    buttons: [{ url: 'https://doc.mysite.com', title: 'View document' }]
  }, {
    title: 'Action',
    subtitle: 'This will trigger an action',
    buttons: [{ payload: 'TRIGGER_ACTION', title: 'Run' }] // This button acts as a quick-reply
  }]
},
```

The renderer above is dupposed to render 2-slides carousel that displays differently on 400 and 750 px-wide screens with custom CSS-styling and with one of the buttons acting as a quick-replies.

You can check [package README](https://github.com/botpress/botpress/tree/master/packages/channels/botpress-channel-web) for details on which other keys carousel accepts.
