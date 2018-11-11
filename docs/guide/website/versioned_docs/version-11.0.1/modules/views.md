---
id: version-11.0.1-views
title: Views
original_id: views
---

The main view of the module is found in the `src/views/index.jsx` file by default.

By modifying this view, you can fetch the data from your new endpoint and present it to the user:

```jsx
export default class TemplateModule extends React.Component {
  state = { dialogSessions: 0 }

  componentDidMount() {
    fetch('/api/ext/dialog-sessions/count')
      .then(res => res.json())
      .then(({ dialogSessions }) => this.setState({ dialogSessions }))
  }

  render() {
    const { dialogSessions } = this.state
    return <h4>{`Currently there are ${dialogSessions} dialog sessions in DB`}</h4>
  }
}
```

It is also possible to expose multiple views. Those new variations needs to be specified in your `package.json` file under the object `botpress.liteViews`. They will be available at `/assets/modules/$YOUR_MODULE/web/fullscreen.bundle.js`

Let's say you want to provide a fullscreen version of your module:

package.json

```js
"botpress": {
  "liteViews": {
    "fullscreen": "./src/views/web/fullscreen.jsx"
  }
}
```

That's it - wasn't too difficult, right?
