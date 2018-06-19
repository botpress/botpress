---
layout: guide
---

It may appear that you need to shorten a link that is too long. E.g. when distributing link to customized webchat that has multiple parameters in URL you may want to:

1. Shorten url
2. Not to redistribute new link to users after changing some of the params.

This case can be handled by creating shortlinks like this:

```js
bp.createShortlink('fullscreen-webchat', '/lite', {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({ config: { /* Cusom config here... */ } })
})
```

The snippet above generates a route `/s/fullscreen-webchat` that redirects user to `/lite` with parameters defined in the object passed as a 3-rd param.
