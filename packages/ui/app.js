require('dotenv').config()
const proxy = require('./proxy')

const { CORE_API_URL, HOST_PORT, HOST_URL } = process.env

proxy({ coreApiUrl: CORE_API_URL, proxyHost: HOST_URL, proxyPort: HOST_PORT }, () => {
  console.log('Botpress is now running on %s:%d', HOST_URL, HOST_PORT)
})
