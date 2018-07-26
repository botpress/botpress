import express from 'express'
import path from 'path'

import { ModuleMetadata } from 'botpress-module-sdk'

const app = express()

app.use(express.static('../static'))

app.get('/', (req, res) => {
  res.contentType('text/javascript')
  const root = path.resolve('.')
  res.sendFile('./static/channel-web.js', { root })
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
