import express from 'express'
import bodyParser from 'body-parser'
import initializeDb from './db'
import middleware from './middleware'
import api from './api'
import config from './config.json'
import path from 'path'

const app = express()

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
})

export default app
