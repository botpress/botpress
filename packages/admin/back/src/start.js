import http from 'http'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import initializeDb from './db'
import middleware from './middleware'
import api from './api'
import config from './config.json'
import path from 'path'
import secure from 'express-force-https'

let app = express()
app.server = http.createServer(app)

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

app.use(
  bodyParser.json({
    limit: config.bodyLimit
  })
)

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

// connect to db
initializeDb((err, db) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  // internal middleware
  app.use('/api', middleware({ config, db }))

  // api router
  app.use('/api', api({ config, db }))

  app.use(express.static(path.join(__dirname, '../static')))

  app.get(/^(?!\/api.*$).*/i, (req, res, next) => {
    res.sendFile(path.join(__dirname, '../static/index.html'))
  })

  app.use((err, req, res, next) => {
    const statusCode = err.status || 500
    const code = err.code || 'BPC_000'
    const message = (err.code && err.message) || 'Unexpected error'
    const devOnly =
      process.env.NODE_ENV === 'production'
        ? {}
        : {
            stack: err.stack,
            full: err.message
          }

    res.status(statusCode).json({
      status: 'error',
      code: code,
      type: err.type || Object.getPrototypeOf(err).name || 'Exception',
      message: message,
      docs: err.docs || 'https://botpress.io/docs/cloud',
      ...devOnly
    })
  })

  app.server.listen(process.env.PORT || config.port, () => {
    console.log(`Started on port ${app.server.address().port}`)
  })
})

export default app
