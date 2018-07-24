import 'reflect-metadata'

import errorHandler from 'errorhandler'
import dotenv from 'dotenv'

import app from './app'
// import Database, { DatabaseConfig } from './database'

dotenv.config()

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler())
}

// // TODO Load database config from `botpress.config.json`
// const dbConfig: DatabaseConfig = { type: 'sqlite3', location: './db.sqlite' }

// database.initialize(dbConfig)
// console.log('==>', database)

const server = app.listen(process.env.HOST_PORT, () => {
  console.log(
    '** App is running at %s:%d in %s mode',
    process.env.HOST_URL,
    process.env.HOST_PORT,
    process.env.ENVIRONMENT
  )
  console.log('** Press CTRL-C to stop\n')
})

export default server
