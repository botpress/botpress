require('dotenv').config()

const express = require('express')
const app = express()
const path = require('path')
const proxy = require('express-http-proxy')
const _ = require('lodash')
const bodyParser = require('body-parser')
const qs = require('querystring')

const { HttpProxy } = require('@botpress/xx-util')

const BASE_PATH = '/api/v1'
const BOT_PATH = BASE_PATH + '/bots/bot123'

app.use(bodyParser.json())
app.use(express.static('./static'))

const { CORE_API_URL } = process.env
const httpProxy = new HttpProxy(app, CORE_API_URL)

httpProxy
  .proxy('/api/modules', BASE_PATH + '/modules')
  .proxy('/js/modules/channel-web', BASE_PATH + '/modules/channel-web')
  .proxy('/api/bot/information', BOT_PATH)

app.post(
  '/api/middlewares/customizations',
  proxy(CORE_API_URL, {
    proxyReqPathResolver: async (req, res) => BOT_PATH + '/middleware',
    proxyReqBodyDecorator: async (body, srcReq) => {
      // Middleware(s) is a typo. Can't be plural.
      return { middleware: body.middlewares }
    }
  })
)

httpProxy.proxy('/api/middlewares', BOT_PATH + '/middleware')

app.post(
  '/api/content/categories/:categoryId/items/:itemId',
  proxy(CORE_API_URL, {
    proxyReqPathResolver: req => {
      return `${BOT_PATH}/content/${req.params.categoryId}/elements/${req.params.itemId}`
    }
  })
)

app.post(
  '/api/content/categories/:categoryId/items',
  proxy(CORE_API_URL, {
    proxyReqPathResolver: async (req, res) => {
      return `${BOT_PATH}/content/${req.params.categoryId}/elements`
    }
  })
)

httpProxy.proxy('/api/content/categories', BOT_PATH + '/content/types')

app.get(
  '/api/content/items-batched/:itemIds',
  proxy(CORE_API_URL, {
    proxyReqPathResolver: req => {
      const elementIds = req.params.itemIds.split(',')
      return `${BOT_PATH}/content/elements?ids=${elementIds.join(',')}`
    }
  })
)

app.get(
  '/api/content/items',
  proxy(CORE_API_URL, {
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
  proxy(CORE_API_URL, {
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
  proxy(CORE_API_URL, {
    proxyReqPathResolver: (req, res) => {
      const elementId = req.params.itemId
      return `${BOT_PATH}/content/elements/${elementId}`
    }
  })
)

httpProxy.proxy('/api/flows/available_actions', BOT_PATH + '/actions')

httpProxy.proxy('/api/flows/all', BOT_PATH + '/flows')

app.post(
  '/api/flows/save',
  proxy(CORE_API_URL, {
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
