const express = require('express')
const app = express()
const path = require('path')
const dotenv = require('dotenv')
var proxy = require('express-http-proxy')
const fs = require('fs')

dotenv.config()

app.use(express.static('./static'))

const apiProxy = (originPath, targetPath, targetHost) => {
  app.use(
    originPath,
    proxy(targetHost, {
      proxyReqPathResolver: (req, res) => new Promise((resolve, reject) => resolve(targetPath))
    })
  )
}

apiProxy('/api/modules', '/api/v1/core/modules', process.env.CORE_API_URL)
apiProxy('/api/bot/information', '/api/v1/core/modules', process.env.CORE_API_URL)

//api/v1/core/bots/{botId}/...
//api/v1/nlu/bots/{botId}/...
//api/v1/hitl/bots/{botId}/...

app.get('/js/env.js', (req, res) => {
  res.contentType('text/javascript')
  res.send(`
    (function(window) {
        window.NODE_ENV = "production";
        window.BOTPRESS_ENV = "dev";
        window.BOTPRESS_CLOUD_ENABLED = false;
        window.BOTPRESS_CLOUD_SETTINGS = {"botId":"","endpoint":"","teamId":"","env":"dev"};
        window.DEV_MODE = true;
        window.AUTH_ENABLED = false;
        window.AUTH_TOKEN_DURATION = 21600000;
        window.OPT_OUT_STATS = false;
        window.SHOW_GUIDED_TOUR = false;
        window.BOTPRESS_VERSION = "10.22.3";
        window.APP_NAME = "Botpress";
        window.GHOST_ENABLED = false;
        window.BOTPRESS_FLOW_EDITOR_DISABLED = null;
      })(typeof window != 'undefined' ? window : {})
    `)
})

app.get('/js/commons.js', (req, res) => {
  const absolutePath = path.join(__dirname, 'static/commons.js')

  if (!fs.existsSync(absolutePath)) {
    console.error('commons.js is missing!')
  }

  res.contentType('text/javascript')
  res.sendFile(absolutePath)
})

app.get('/js/web.729e9680ac37ff307159.js', (req, res) => {
  const absolutePath = path.join(__dirname, 'static/web.729e9680ac37ff307159.js')

  if (!fs.existsSync(absolutePath)) {
    console.error('web.729e9680ac37ff307159.js is missing!')
  }

  res.contentType('text/javascript')
  res.sendFile(absolutePath)
})

app.get('/api/notifications/inbox', (req, res) => {
  res.send('[]')
})

app.listen(process.env.HOST_PORT, () =>
  console.log('Botpress is now running on %s:%d', process.env.HOST_URL, process.env.HOST_PORT)
)
