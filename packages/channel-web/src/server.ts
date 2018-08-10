import dotenv from 'dotenv'
import errorHandler from 'errorhandler'

import app from './app'

dotenv.config()

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler())
}

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
