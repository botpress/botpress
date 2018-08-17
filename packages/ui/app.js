const express = require('express')
const app = express()
const path = require('path')
const dotenv = require('dotenv')
const proxy = require('express-http-proxy')
const _ = require('lodash')
const bodyParser = require('body-parser')
const qs = require('querystring')

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

httpProxy('/api/modules', '/api/v1/modules', process.env.CORE_API_URL)
httpProxy('/js/modules/channel-web', '/api/v1/modules/channel-web', process.env.CORE_API_URL)
httpProxy('/api/bot/information', '/api/v1/bots/bot123/', process.env.CORE_API_URL)

app.post(
  '/api/middlewares/customizations',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: async (req, res) => '/api/v1/bots/bot123/middleware',
    proxyReqBodyDecorator: async (body, srcReq) => {
      // Middleware(s) is a typo. Can't be plural.
      return { middleware: body.middlewares }
    }
  })
)

httpProxy('/api/middlewares', '/api/v1/bots/bot123/middleware', process.env.CORE_API_URL)

app.post(
  '/api/content/categories/:categoryId/items/:itemId',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: req => {
      return `/api/v1/bots/bot123/content/${req.params.categoryId}/elements/${req.params.itemId}`
    }
  })
)

app.post(
  '/api/content/categories/:categoryId/items',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: async (req, res) => {
      return `/api/v1/bots/bot123/content/${req.params.categoryId}/elements`
    }
  })
)

httpProxy('/api/content/categories', '/api/v1/bots/bot123/content/types', process.env.CORE_API_URL)

app.get(
  '/api/content/items',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: req => {
      const oQuery = req.query || {}
      const query = qs.stringify(_.pick(oQuery, ['from', 'count', 'searchTerm']))
      if (!oQuery.categoryId || oQuery.categoryId === 'all') {
        return `/api/v1/bots/bot123/content/elements?${query}`
      }

      return `/api/v1/bots/bot123/content/${oQuery.categoryId}/elements?${query}`
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
      return `/api/v1/bots/bot123/content/elements/count`
    }
  })
)

app.get(
  '/api/content/items/:itemId',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: (req, res) => {
      const elementId = req.params.itemId
      return `/api/v1/bots/bot123/content/elements/${elementId}`
    }
  })
)

httpProxy('/api/flows/available_actions', '/api/v1/bots/bot123/actions', process.env.CORE_API_URL)

httpProxy('/api/flows/all', '/api/v1/bots/bot123/flows', process.env.CORE_API_URL)
app.post(
  '/api/flows/save',
  proxy(process.env.CORE_API_URL, {
    proxyReqPathResolver: () => {
      return '/api/v1/bots/bot123/flows'
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

  res.contentType('text/javascript')
  res.sendFile(absolutePath)
})

app.get('/js/web.729e9680ac37ff307159.js', (req, res) => {
  const absolutePath = path.join(__dirname, 'static/web.729e9680ac37ff307159.js')

  res.contentType('text/javascript')
  res.sendFile(absolutePath)
})

app.get('/api/notifications/inbox', (req, res) => {
  res.send('[]')
})

app.get('/api/community/hero', (req, res) => {
  res.send({ hidden: true })
})

app.get('/api/botpress-plateforme-webchat/inject.js', (req, res) => {
  const absolutePath = path.join(__dirname, 'static/inject.js')

  res.contentType('text/javascript')
  res.sendFile(absolutePath)
})

app.get('/*', (req, res) => {
  const absolutePath = path.join(__dirname, 'static/index.html')

  res.contentType('text/html')
  res.sendFile(absolutePath)
})

app.listen(process.env.HOST_PORT, () =>
  console.log('Botpress is now running on %s:%d', process.env.HOST_URL, process.env.HOST_PORT)
)
