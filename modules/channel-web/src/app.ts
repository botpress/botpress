import express from 'express'

import { ModuleMetadata } from 'botpress-module-sdk'

const app = express()

app.use(express.static('../static'))

app.get('/', (req, res) => {
  res.contentType('text/javascript')
  res.sendFile('./static/channel-web.js', { root: __dirname })
})

app.get('/register', (req, res) => {
  const metadata: ModuleMetadata = {
    name: 'channel-web',
    incomingMiddleware: [],
    outgoingMiddleware: [],
    version: '0.0.1'
  }

  res.send(metadata)
})

export default app
