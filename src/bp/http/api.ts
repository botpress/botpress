const express = require('express')
const path = require('path')
const proxy = require('express-http-proxy')
const _ = require('lodash')
const bodyParser = require('body-parser')
const qs = require('querystring')
const tamper = require('tamper')

const { HttpProxy, extractBotId, getApiBasePath, BASE_PATH, noCache } = require('./common')
const version = '10.42.1'

async function start({ coreApiUrl, proxyHost, proxyPort }, callback) {
  const app = express()

  app.use(noCache)
  app.use(bodyParser.json())

  const httpProxy = new HttpProxy(app, coreApiUrl)

  const options = { httpProxy, coreApiUrl, app, proxyHost, proxyPort }

  await setupStaticProxy(options)
  await setupAPIProxy(options)
  await setupStudioAppProxy(options)
  await setupAdminAppProxy(options)

  return app.listen(proxyPort, callback)
}

function setupStaticProxy({ httpProxy, coreApiUrl, app, proxyHost, proxyPort }) {
  app.use('/fonts', express.static(path.join(__dirname, 'static/studio/fonts')))
  app.use('/img', express.static(path.join(__dirname, 'static/studio/img')))
}

function setupStudioAppProxy({ httpProxy, coreApiUrl, app, proxyHost, proxyPort }) {
  app.get('/studio', (req, res, next) => {
    res.redirect('/admin')
  })

  app.use(
    '/:app(studio|lite)/:botId?',
    tamper(function(req, res) {
      const contentType = res.getHeaders()['content-type']
      if (!contentType.includes('text/html')) {
        return
      }

      return function(body) {
        let { botId, app } = req.params
        if (!botId && app === 'lite') {
          botId = extractBotId(req)
        }

        return body.replace(/\$\$BP_BASE_URL\$\$/g, `/${app}/${botId}`)
      }
    })
  )

  app.get('/:app(studio|lite)/:botId/js/env.js', (req, res) => {
    const { botId, app } = req.params

    let liteEnv = `
        // Lite Views Specific
    `
    let studioEnv = `
        // Botpress Studio Specific
        window.BOTPRESS_AUTH_FULL = true;
        window.AUTH_TOKEN_DURATION = 21600000;
        window.OPT_OUT_STATS = false;
        window.SHOW_GUIDED_TOUR = false;
        window.GHOST_ENABLED = false;
        window.BOTPRESS_FLOW_EDITOR_DISABLED = null;
        window.BOTPRESS_CLOUD_SETTINGS = {"botId":"","endpoint":"","teamId":"","env":"dev"};
    `

    let totalEnv = `
    (function(window) {
        // Common
        window.BASE_PATH = "/${app}";
        window.BP_BASE_PATH = "/${app}/${botId}";
        window.BP_SOCKET_URL = '${coreApiUrl}';
        window.BOTPRESS_VERSION = "${version}";
        window.APP_NAME = "Botpress";
        window.BOTPRESS_XX = true;
        window.NODE_ENV = "production";
        window.BOTPRESS_ENV = "dev";
        window.BOTPRESS_CLOUD_ENABLED = false;
        window.DEV_MODE = true;
        window.AUTH_ENABLED = true;
        ${app === 'studio' ? studioEnv : ''}
        ${app === 'lite' ? liteEnv : ''}
        // End
      })(typeof window != 'undefined' ? window : {})
    `

    res.contentType('text/javascript')
    res.send(totalEnv)
  })

  app.use('/:app(studio)/:botId', express.static(path.join(__dirname, 'static/studio')))
  app.use('/:app(lite)/:botId?', express.static(path.join(__dirname, 'static/studio/lite')))
  app.use('/:app(lite)/:botId', express.static(path.join(__dirname, 'static/studio'))) // Fallback Static Assets
  app.get(['/:app(studio)/:botId/*'], (req, res) => {
    const absolutePath = path.join(__dirname, 'static/studio/index.html')
    res.contentType('text/html')
    res.sendFile(absolutePath)
  })
}

function setupAPIProxy({ httpProxy, coreApiUrl, app, proxyHost, proxyPort }) {
  httpProxy.proxyForBot('/api/bot/information', '/')
  httpProxy.proxyAdmin('/api/teams/bots', '/teams/bots')

  app.post(
    '/api/middlewares/customizations',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => getApiBasePath(req) + '/middleware',
      proxyReqBodyDecorator: async (body, srcReq) => {
        // Middleware(s) is a typo. Can't be plural.
        return { middleware: body.middlewares }
      }
    })
  )

  httpProxy.proxyForBot('/api/middlewares', '/middleware')

  app.post(
    '/api/media',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => getApiBasePath(req) + '/media',
      parseReqBody: false
    })
  )

  app.get(
    '/media',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => getApiBasePath(req) + '/media'
    })
  )

  app.post(
    '/api/content/categories/:categoryId/items/:itemId',
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        return `${getApiBasePath(req)}/content/${req.params.categoryId}/elements/${req.params.itemId}`
      }
    })
  )

  app.post(
    '/api/content/categories/:categoryId/items',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => {
        return `${getApiBasePath(req)}/content/${req.params.categoryId}/elements`
      }
    })
  )

  httpProxy.proxyForBot('/api/content/categories', '/content/types')

  app.get(
    '/api/content/items-batched/:itemIds',
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        const elementIds = req.params.itemIds.split(',')
        return `${getApiBasePath(req)}/content/elements?ids=${elementIds.join(',')}`
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
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        const apiPath = getApiBasePath(req)
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
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        const contentType = req.query.categoryId
        const apiPath = getApiBasePath(req)

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
        const apiPath = getApiBasePath(req)
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

  httpProxy.proxyForBot('/api/flows/available_actions', '/actions')

  httpProxy.proxyForBot('/api/flows/all', '/flows')

  app.post(
    '/api/flows/save',
    proxy(coreApiUrl, {
      proxyReqPathResolver: req => {
        return getApiBasePath(req) + '/flows'
      },
      proxyReqBodyDecorator: async body => {
        // name prop is new
        // version prop is missing from the original ui payload
        body.forEach(x => _.assign(x, { name: x.flow, version: '0.0.1' }))
        return body
      }
    })
  )

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
        const apiPath = getApiBasePath(req)
        const limit = req.query.limit
        return limit ? `${apiPath}/logs?limit=${limit}` : `${apiPath}/logs`
      }
    })
  )

  /**
   * Auth
   */

  httpProxy.proxyForBot('/api/auth/', {
    proxyReqPathResolver: req => req.originalUrl.replace('/api/auth/', '/api/v1/auth/')
  })

  httpProxy
    .proxyForBot('/api/login', {
      proxyReqPathResolver: () => '/api/v1/auth/login',
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
    .proxyForBot('/api/my-account', {
      proxyReqPathResolver: () => '/api/v1/auth/me/profile',
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
        const apiPath = getApiBasePath(req)
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
}

function setupAdminAppProxy({ httpProxy, coreApiUrl, app, proxyHost, proxyPort }) {
  const sanitizePath = path => path.replace('//', '/')
  app.use(
    '/admin/api/',
    proxy(coreApiUrl, {
      proxyReqPathResolver: async (req, res) => {
        if (req.path.startsWith('/auth')) {
          return sanitizePath(`${BASE_PATH}/${req.path}`)
        }

        return sanitizePath(`${BASE_PATH}/admin/${req.path}`)
      }
    })
  )
  app.use('/admin', express.static(path.join(__dirname, '../ui-admin/public')))
  app.get(['/admin', '/admin/*'], (req, res) => {
    const absolutePath = path.join(__dirname, '../ui-admin/public/index.html')
    res.contentType('text/html')
    res.sendFile(absolutePath)
  })
  app.get('/', (req, res) => {
    res.redirect('/admin')
  })
}

module.exports = { start }
