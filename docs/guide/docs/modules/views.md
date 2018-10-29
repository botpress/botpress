---
id: views
title: Views
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

Your view is created, but there is still one step to make it available. The following snippet indicates to Botpress what bundle it should use when the index file is requested.

```js
const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(**dirname, '../web/web.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return Buffer.from('')
}
```

It is also possible to expose multiple views. Those new variations needs to be specified in your `package.json` file under the object `botpress.liteViews`. Then, you need to add those new views to `serveFile`.

Let's say you want to provide a fullscreen version of your module:

package.json

```js
"botpress": {
  "liteViews": {
    "fullscreen": "./src/views/web/fullscreen.jsx"
  }
}
```

index.ts (in the serveFile method)

```js
const mapping = {
  'index.js': path.join(**dirname, '../web/web.bundle.js'),
  'fullscreen.js': path.join(\_\_dirname, '../web/fullscreen.bundle.js')
}
```

That's it - wasn't too difficult, right?
