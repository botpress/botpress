require('dotenv').config()
const proxy = require('./proxy')

const { CORE_API_URL, HOST_PORT, HOST_URL } = process.env

proxy({ core_api_url: CORE_API_URL, proxy_host: HOST_URL, proxy_port: HOST_PORT }, () => {
  console.log('Botpress is now running on %s:%d', HOST_URL, HOST_PORT)
})
