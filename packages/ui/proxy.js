const express = require('express')
const path = require('path')
const proxy = require('express-http-proxy')
const _ = require('lodash')
const bodyParser = require('body-parser')
const qs = require('querystring')

const { HttpProxy, setApiBasePath, BASE_PATH } = require('@botpress/xx-util')
const { version: uiVersion } = require('botpress/package.json')

// UI res.set(...)
// Proxy req.get(...)
// Proxy set api path

function noCache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  delete req.headers['if-modified-since']
  delete req.headers['if-none-match']
  next()
}

function start({ coreApiUrl, proxyHost, proxyPort }, callback) {
  const app = express()
  app.use(bodyParser.json())
  app.use(express.static(path.join(__dirname, 'static')))

  const httpProxy = new HttpProxy(app, coreApiUrl)

  httpProxy.proxy('/api/bot/information', '/')

  app.post(
    '/api/middlewares/customizations',
    noCache,
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => setApiBasePath(req) + '/middleware',
      proxyReqBodyDecorator: async (body, srcReq) => {
        // Middleware(s) is a typo. Can't be plural.
        return { middleware: body.middlewares }
      }
    })
  )

  httpProxy.proxy('/api/middlewares', '/middleware')

  app.post(
    '/api/media',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => setApiBasePath(req) + '/media',
      parseReqBody: false
    })
  )

  app.get(
    '/media',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => setApiBasePath(req) + '/media'
    })
  )

  app.post(
    '/api/content/categories/:categoryId/items/:itemId',
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        return `${setApiBasePath(req)}/content/${req.params.categoryId}/elements/${req.params.itemId}`
      }
    })
  )

  app.post(
    '/api/content/categories/:categoryId/items',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => {
        return `${setApiBasePath(req)}/content/${req.params.categoryId}/elements`
      }
    })
  )

  httpProxy.proxy('/api/content/categories', '/content/types')

  app.get(
    '/api/content/items-batched/:itemIds',
    noCache,
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        const elementIds = req.params.itemIds.split(',')
        return `${setApiBasePath(req)}/content/elements?ids=${elementIds.join(',')}`
      },
      userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
        const body = JSON.parse(proxyResData)
        return body.map(x => ({
          ...x,
          categoryId: x.contentType,
          data: x.computedData,
          categorySchema: x.schema,
          categoryTitle: x.schema.title
        }))
      }
    })
  )

  app.get(
    '/api/content/items',
    noCache,
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        const apiPath = setApiBasePath(req)
        const oQuery = req.query || {}
        const query = qs.stringify(_.pick(oQuery, ['from', 'count', 'searchTerm']))

        if (!oQuery.categoryId || oQuery.categoryId === 'all') {
          return `${apiPath}/content/elements?${query}`
        }
        return `${apiPath}/content/${oQuery.categoryId}/elements?${query}`
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
    noCache,
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        const contentType = req.query.categoryId
        const apiPath = setApiBasePath(req)

        if (contentType) {
          return `${apiPath}/content/${contentType}/elements/count`
        }
        return `${apiPath}/content/elements/count`
      }
    })
  )

  app.get(
    '/api/content/items/:itemId',
    proxy(coreApiUrl, {
      proxyReqPathResolver: (req, res) => {
        const elementId = req.params.itemId
        const apiPath = setApiBasePath(req)
        return `${apiPath}/content/elements/${elementId}`
      },
      userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
        const body = JSON.parse(proxyResData)
        return {
          ...body,
          categoryId: body.contentType,
          data: body.computedData,
          categorySchema: body.schema,
          categoryTitle: body.schema.title
        }
      }
    })
  )

  httpProxy.proxy('/api/flows/available_actions', '/actions')

  httpProxy.proxy('/api/flows/all', '/flows')

  app.post(
    '/api/flows/save',
    noCache,
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        return setApiBasePath(req) + '/flows'
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
        window.AUTH_ENABLED = true;
        window.BOTPRESS_AUTH_FULL = true;
        window.BP_SOCKET_URL = '${coreApiUrl}';
        window.AUTH_TOKEN_DURATION = 21600000;
        window.OPT_OUT_STATS = false;
        window.SHOW_GUIDED_TOUR = false;
        window.BOTPRESS_VERSION = "${uiVersion}";
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

  app.get(
    '/api/logs',
    proxy(coreApiUrl, {
      proxyReqPathResolver: (req, res) => {
        const apiPath = setApiBasePath(req)
        const limit = req.query.limit
        return limit ? `${apiPath}/logs?limit=${limit}` : `${apiPath}/logs`
      }
    })
  )

  /**
   * Auth
   */
  httpProxy
    .proxy('/api/login', {
      proxyReqPathResolver: () => '/api/v1/admin/login',
      proxyReqBodyDecorator: ({ user, password }) => {
        return { username: user, password }
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        try {
          const data = JSON.parse(proxyResData.toString('utf8'))
          if (data.status === 'error') {
            userRes.status(200)
            return JSON.stringify({ success: false, reason: data.message })
          } else {
            return JSON.stringify({ success: true, token: data.payload.token })
          }
        } catch (e) {
          console.error(e)
          return proxyResData
        }
      }
    })
    .proxy('/api/my-account', {
      proxyReqPathResolver: () => '/api/v1/admin/me/profile',
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        try {
          const data = JSON.parse(proxyResData.toString('utf8'))
          if (data.status === 'error') {
            userRes.status(200)
            return JSON.stringify({ success: false, reason: data.message })
          } else {
            return JSON.stringify(data.payload)
          }
        } catch (e) {
          console.error(e)
          return proxyResData
        }
      }
    })

  /**
   * Modules
   */
  app.all(
    '/api/botpress-platform-webchat/*',
    proxy(coreApiUrl, {
      proxyReqPathResolver: (req, res) => {
        let parts = _.drop(req.path.split('/'), 3)
        const newPath = parts.join('/')
        const newQuery = qs.stringify(req.query)
        const apiPath = setApiBasePath(req)
        return `${apiPath}/ext/channel-web/${newPath}?${newQuery}`
      }
    })
  )

  app.get(
    '/api/modules',
    proxy(coreApiUrl, {
      proxyReqPathResolver: () => {
        return `${BASE_PATH}/modules/`
      }
    })
  )

  app.get(
    [`/js/modules/:moduleName`, `/js/modules/:moduleName/:subview`],
    proxy(coreApiUrl, {
      proxyReqPathResolver: (req, res) => {
        let moduleName = req.params.moduleName

        if (moduleName === 'web.bundle.js.map') {
          return null
        }

        let path = req.params.subview || 'index.js'
        if (!path.endsWith('.js')) {
          path = path + '.js'
        }

        return `${BASE_PATH}/modules/${moduleName}/files?path=${path}`
      }
    })
  )

  app.get('/*', (req, res) => {
    const absolutePath = path.join(__dirname, 'static/index.html')

    res.contentType('text/html')
    res.sendFile(absolutePath)
  })

  return app.listen(proxyPort, callback)
}

module.exports = start
