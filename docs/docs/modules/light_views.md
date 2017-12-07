---
layout: guide
---

**Lightweight Views** are views that are, as their name say, lightweight. They do not inherit all the default Botpress interface (which is heavy). They contain no styling and no built-in libraries. The only thing they have is direct access to `bp` which contains a reference to the EventBus (WebSocket) and Axios.

Lightweight views are bundled apart from the traditional module bundle.

Here's how to create one:

1. Create a react component under a `.jsx` file that exports the component class by default (`export default`)

2. In your module's `webpack.js` file, locate the `lite` configuration. In the `entry` object, name your view and point to the file.

3. Re-bundle your module (`npm run compile`)

See the [botpress-web](https://github.com/botpress/botpress-platform-webchat) module for an example
