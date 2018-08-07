---
layout: guide
---

Webchat carousel is a useful way of showing a collection of elements. The example below shows two different types of element, shown in a responsive layout, depending on the width of the users device. 

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
  'web-style': { direction: 'rtl' }, // This allows you to add custom CSS-styling
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

You can check the [package README](https://github.com/botpress/botpress/tree/master/packages/channels/botpress-channel-web) for all the options you can pass into the carousel object.
