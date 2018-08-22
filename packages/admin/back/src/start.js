import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import secure from 'express-force-https'
import path from 'path'

import config from './config.json'

const app = express()

const { HttpProxy } = require('@botpress/xx-util')

const { CORE_API_URL } = process.env
const httpProxy = new HttpProxy(app, CORE_API_URL)

if (process.env.FORCE_HTTPS) {
  app.use(secure)
}

app.use(morgan('dev'))

app.use(
  cors({
    exposedHeaders: config.corsHeaders
  })
)

httpProxy.proxy('/api/', {
  proxyReqPathResolver: req => req.url.replace('/api/', '/api/v1/auth/')
})

app.use(express.static(path.join(__dirname, '../static')))

app.get(/^(?!\/api.*$).*/i, (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'))
})

const port = process.env.PORT || config.port
app.listen(port, () => {
  console.log(`Started on port ${port}`)
})
