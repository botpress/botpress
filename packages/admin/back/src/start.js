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

// logger
app.use(morgan('dev'))

// 3rd party middleware
app.use(
  cors({
    exposedHeaders: config.corsHeaders
  })
)

httpProxy.proxy('/api/', {
  proxyReqPathResolver: req => req.url.replace('/api/', '/api/auth/')
})

app.use(express.static(path.join(__dirname, '../static')))

app.listen(process.env.PORT || config.port, () => {
  console.log(`Started on port ${app.server.address().port}`)
})
