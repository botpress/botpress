const express = require('express')
const app = express()
const path = require('path')
const dotenv = require('dotenv')
const proxy = require('express-http-proxy')
const _ = require('lodash')
const bodyParser = require('body-parser')
const qs = require('querystring')

const BASE_PATH = '/api/v1'
const BOT_PATH = BASE_PATH + '/bots/bot123'

dotenv.config()

app.use(bodyParser.json())
app.use(express.static('./static'))

// TODO: Extract in shared module
const httpProxy = (originPath, targetPath, targetHost) => {
  app.use(
    originPath,
    proxy(targetHost, {
      proxyReqPathResolver: async (req, res) => targetPath
    })
  )
}

httpProxy('/api/bot/information', BOT_PATH, process.env.CORE_API_URL)

app.use(
  '/socket.io',
  proxy(process.env.CORE_API_URL, {
    timeout: 20000,
    proxyReqPathResolver: function(req) {
      return '/socket.io' + require('url').parse(req.url).path
    },
    userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
      console.log(proxyRes.statusCode, proxyResData.toString())
      return proxyResData
    }
  })
)

// httpProxy('/socket.io', '/socket.io', process.env.CORE_API_URL)

app.post(
  '/api/middlewares/customizations',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: async (req, res) => BOT_PATH + '/middleware',
    proxyReqBodyDecorator: async (body, srcReq) => {
      // Middleware(s) is a typo. Can't be plural.
      return { middleware: body.middlewares }
    }
  })
)

//const oQuery = req.query || {}
httpProxy('/api/middlewares', BOT_PATH + '/middleware', process.env.CORE_API_URL)

app.post(
  '/api/content/categories/:categoryId/items/:itemId',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: req => {
      return `${BOT_PATH}/content/${req.params.categoryId}/elements/${req.params.itemId}`
    }
  })
)

app.post(
  '/api/content/categories/:categoryId/items',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: async (req, res) => {
      return `${BOT_PATH}/content/${req.params.categoryId}/elements`
    }
  })
)

httpProxy('/api/content/categories', BOT_PATH + '/content/types', process.env.CORE_API_URL)

app.get(
  '/api/content/items-batched/:itemIds',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: req => {
      const elementIds = req.params.itemIds.split(',')
      return `${BOT_PATH}/content/elements?ids=${elementIds.join(',')}`
    }
  })
)

app.get(
  '/api/content/items',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: req => {
      const oQuery = req.query || {}
      const query = qs.stringify(_.pick(oQuery, ['from', 'count', 'searchTerm']))
      if (!oQuery.categoryId || oQuery.categoryId === 'all') {
        return `${BOT_PATH}/content/elements?${query}`
      }
      return `${BOT_PATH}/content/${oQuery.categoryId}/elements?${query}`
    },
    userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
      const body = JSON.parse(proxyResData)
      body.forEach(x => _.assign(x, { categoryId: x.contentType }))
      return body
    }
  })
)

app.get(
  '/api/content/items/count',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: req => {
      const contentType = req.query.categoryId
      if (contentType) {
        return `${BOT_PATH}/content/${contentType}/elements/count`
      }
      return `${BOT_PATH}/content/elements/count`
    }
  })
)

app.get(
  '/api/content/items/:itemId',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: (req, res) => {
      const elementId = req.params.itemId
      return `${BOT_PATH}/content/elements/${elementId}`
    }
  })
)

httpProxy('/api/flows/available_actions', BOT_PATH + '/actions', process.env.CORE_API_URL)

httpProxy('/api/flows/all', BOT_PATH + '/flows', process.env.CORE_API_URL)
app.post(
  '/api/flows/save',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: () => {
      return BOT_PATH + '/flows'
    },
    proxyReqBodyDecorator: async body => {
      // name prop is new
      // version prop is missing from the original ui payload
      body.forEach(x => _.assign(x, { name: x.flow, version: '0.0.1' }))
      return body
    }
  })
)

app.get('/js/env.js', (req, res) => {
  // TODO FIX Implement this
  res.contentType('text/javascript')
  res.send(`
    (function(window) {
        window.NODE_ENV = "production";
        window.BOTPRESS_ENV = "dev";
        window.BOTPRESS_CLOUD_ENABLED = false;
        window.BOTPRESS_CLOUD_SETTINGS = {"botId":"","endpoint":"","teamId":"","env":"dev"};
        window.DEV_MODE = true;
        window.AUTH_ENABLED = false;
        window.BP_SOCKET_URL = 'http://localhost:3000';
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

app.get('/api/notifications/inbox', (req, res) => {
  res.send('[]')
})

app.get('/api/community/hero', (req, res) => {
  res.send({ hidden: true })
})

/********
  Modules
*********/
app.all(
  '/api/botpress-platform-webchat/*',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: (req, res) => {
      let parts = _.drop(req.path.split('/'), 3)
      const newPath = parts.join('/')
      return `${BOT_PATH}/ext/channel-web/${newPath}`
    }
  })
)
httpProxy('/api/modules', BASE_PATH + '/modules', process.env.CORE_API_URL)
app.get(
  [`/js/modules/:moduleName`, `/js/modules/:moduleName/:subview`],
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: (req, res) => {
      let moduleName = req.params.moduleName

      let path = req.params.subview || 'index.js'
      if (!path.endsWith('.js')) {
        path = path + '.js'
      }

      return `${BASE_PATH}/modules/${moduleName}/files?path=${path}`
    }
  })
)
//////////

app.get('/*', (req, res) => {
  const absolutePath = path.join(__dirname, 'static/index.html')

  res.contentType('text/html')
  res.sendFile(absolutePath)
})

app.listen(process.env.HOST_PORT, () =>
  console.log('Botpress is now running on %s:%d', process.env.HOST_URL, process.env.HOST_PORT)
)
