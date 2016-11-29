## Events

Just like middlewares are for all communications between the external world and your bot, **Events** are for all internal and inter-modules communications.

Events are sent and listened on by botpress's [EventBus](TODO), which is just like a regular [EventEmitter](https://nodejs.org/api/events.html) except that events are distributed in real-time to all listeners on the server-side and the client-side through websockets. This means that you can emit events in your React code and capture them in the module's node codebase.

When developping a module, it is considered good practice to emit events for the various tasks it does.

## Example

Module **`/src/index.js`**

```js
module.exports = {
  init: function(bp) {},
  ready: function(bp) {
    bp.events.on('test.clicked', data => {
      bp.logger.debug('[EVENT TEST]', data)
    })
  }
}
```

module **`/src/views/index.jsx`**

```js
import React from 'react'

export default class TemplateModule extends React.Component {

 emitEvent() {
   this.props.bp.events.emit('test.clicked', { a: '123' })
 }

 render() {
   return <button onClick={::this.emitEvent}>Click me</button>
 }
}
```

![](/assets/video-events-demo.gif)


## When not to use Events
