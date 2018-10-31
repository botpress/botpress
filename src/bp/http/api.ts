import bodyParser from 'body-parser'
import * as sdk from 'botpress/sdk'
import cors from 'cors'
import express from 'express'
import proxy from 'express-http-proxy'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'
import portFinder from 'portfinder'
import qs from 'querystring'
import tamper from 'tamper'

import { ConfigProvider } from '../core/config/config-loader'
import { TYPES } from '../core/types'

import { BASE_PATH, extractBotId, getApiBasePath, HttpProxy, noCache } from './common'

@injectable()
export default class ProxyUI {
  public readonly app: express.Express

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger
  ) {
    this.app = express()
    this.app.use(noCache)
    this.app.use(bodyParser.json())
  }

  async start() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = botpressConfig.httpServer
    const hostname = config.host === undefined ? 'localhost' : config.host
    const coreApiUrl = `http://${hostname}:${process.PORT}`
    const proxyHost = `http://${hostname}`

    if (config.cors && config.cors.enabled) {
      this.app.use(cors(config.cors.origin ? { origin: config.cors.origin } : {}))
    }

    process.PROXY_PORT = await portFinder.getPortPromise({ port: config.proxyPort })
    if (process.PROXY_PORT !== config.proxyPort) {
      this.logger.warn(
        `Configured proxy port ${config.proxyPort} is already in use. Using next port available: ${process.PROXY_PORT}`
      )
    }

    const httpProxy = new HttpProxy(this.app, coreApiUrl)
    const options = { httpProxy, coreApiUrl, app: this.app, proxyHost, proxyPort: process.PROXY_PORT }

    await this.setupStaticProxy(options)
    await this.setupAPIProxy(options)
    await this.setupStudioAppProxy(options)
    await this.setupAdminAppProxy(options)

    await Promise.fromCallback(callback => this.app.listen(process.PROXY_PORT, callback))
  }

  private setupStaticProxy({ app }) {
    app.use('/fonts', express.static(path.join(__dirname, '../ui-studio/static/fonts')))
    app.use('/img', express.static(path.join(__dirname, '../ui-studio/static/img')))
  }

  private setupStudioAppProxy({ coreApiUrl, app }) {
    app.get('/studio', (req, res, next) => {
      res.redirect('/admin')
    })

    app.use(
      '/:app(studio|lite)/:botId?',
      (req, res, next) => {
        // TODO Somehow req.params is overwritten by tamper below
        req.originalParams = { ...req.params }
        next()
      },
      tamper(function(req, res) {
        const contentType = res.getHeaders()['content-type']
        if (!contentType.includes('text/html')) {
          return
        }

        return function(body) {
          // tslint:disable-next-line:prefer-const
          let { botId, app } = req.originalParams

          if (!botId && app === 'lite') {
            botId = extractBotId(req)
          }

          return body.replace(/\$\$BP_BASE_URL\$\$/g, `/${app}/${botId}`)
        }
      })
    )

    app.get(
      '/:app(studio|lite)/:botId/js/env.js',
      proxy(coreApiUrl, {
        proxyReqPathResolver: async req => getApiBasePath(req) + '/studio-params',
        userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
          const data = JSON.parse(proxyResData.toString('utf8'))
          const { botId, app } = userReq.params

          const liteEnv = `
              // Lite Views Specific
          `
          const studioEnv = `
              // Botpress Studio Specific
              window.BOTPRESS_AUTH_FULL = ${data.authentication.enabled};
              window.AUTH_TOKEN_DURATION = ${data.authentication.tokenDuration};
              window.OPT_OUT_STATS = ${!data.sendStatistics};
              window.SHOW_GUIDED_TOUR = ${data.showGuidedTour};
              window.GHOST_ENABLED = ${data.ghostEnabled};
              window.BOTPRESS_FLOW_EDITOR_DISABLED = ${data.flowEditorDisabled};
              window.BOTPRESS_CLOUD_SETTINGS = {"botId":"","endpoint":"","teamId":"","env":"dev"};
          `

          const totalEnv = `
          (function(window) {
              // Common
              window.BASE_PATH = "/${app}";
              window.BP_BASE_PATH = "/${app}/${botId}";
              window.BP_SOCKET_URL = '${coreApiUrl}';
              window.BOTPRESS_VERSION = "${data.botpress.version}";
              window.APP_NAME = "${data.botpress.name}";
              window.BOTPRESS_XX = true;
              window.NODE_ENV = "production";
              window.BOTPRESS_ENV = "dev";
              window.BOTPRESS_CLOUD_ENABLED = false;
              window.DEV_MODE = true;
              window.AUTH_ENABLED = ${data.authentication.enabled};
              ${app === 'studio' ? studioEnv : ''}
              ${app === 'lite' ? liteEnv : ''}
              // End
            })(typeof window != 'undefined' ? window : {})
          `

          userRes.contentType('text/javascript')
          return totalEnv
        }
      })
    )

    app.use('/:app(studio)/:botId', express.static(path.join(__dirname, '../ui-studio/static')))
    app.use('/:app(lite)/:botId?', express.static(path.join(__dirname, '../ui-studio/static/lite')))
    app.use('/:app(lite)/:botId', express.static(path.join(__dirname, '../ui-studio/static'))) // Fallback Static Assets
    app.get(['/:app(studio)/:botId/*'], (req, res) => {
      const absolutePath = path.join(__dirname, '../ui-studio/static/index.html')
      res.contentType('text/html')
      res.sendFile(absolutePath)
    })
  }

  private setupAPIProxy({ httpProxy, coreApiUrl, app, proxyHost, proxyPort }) {
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

    httpProxy.proxyForBot('/api/logs/archive/', '/logs/archive')

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

    app.post(
      '/api/content/categories/all/bulk_delete',
      proxy(coreApiUrl, {
        proxyReqPathResolver: async (req, res) => {
          return `${getApiBasePath(req)}/content/categories/all/bulk_delete`
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
            data: x.formData,
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
            data: body.formData,
            categorySchema: body.schema,
            categoryTitle: body.schema.title
          }
        }
      })
    )

    app.get(
      '/api/ghost_content/status',
      proxy(coreApiUrl, {
        proxyReqPathResolver: async req => getApiBasePath(req) + '/versioning/pending',
        userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
          const body = JSON.parse(proxyResData)
          return _.mapValues(body, (revisions, folder) => {
            return (
              revisions &&
              revisions.map(revision => {
                const rpath = revision.path
                const sfolder = path.sep + folder + path.sep
                const file = rpath.substr(rpath.indexOf(sfolder) + sfolder.length)
                return {
                  ...revision,
                  file
                }
              })
            )
          })
        }
      })
    )

    httpProxy.proxyForBot('/api/versioning/export', '/versioning/export')
    httpProxy.proxyForBot('/api/versioning/revert', '/versioning/revert')

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

    app.get(
      '/api/notifications/inbox',
      proxy(coreApiUrl, {
        proxyReqPathResolver: async req => getApiBasePath(req) + '/notifications'
      })
    )

    app.post(
      '/api/notifications/:notificationId?/:action',
      proxy(coreApiUrl, {
        proxyReqPathResolver: async req => {
          const apiPath = getApiBasePath(req)
          const { notificationId, action } = req.params

          return notificationId
            ? `${apiPath}/notifications/${notificationId}/${action}`
            : `${apiPath}/notifications/${action}`
        }
      })
    )

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
    httpProxy.proxyForBot('/api/auth', {
      proxyReqPathResolver: req => req.originalUrl.replace('/api/auth', '/api/v1/auth')
    })

    app.get(
      '/api/ping',
      proxy(coreApiUrl, {
        proxyReqPathResolver: () => `${BASE_PATH}/auth/ping`
      })
    )

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
    app.post(
      ['/api/ext/qna/import/csv'],
      proxy(coreApiUrl, {
        proxyReqPathResolver: async (req, res) => getApiBasePath(req) + '/ext/qna/import/csv',
        parseReqBody: false
      })
    )

    app.all(
      ['/api/botpress-(:moduleName)/*', '/api/ext/:moduleName/*'],
      proxy(coreApiUrl, {
        proxyReqPathResolver: (req, res) => {
          const parts = _.drop(req.path.split('/'), req.path.includes('/api/ext/') ? 4 : 3)
          const newPath = parts.join('/')
          const newQuery = qs.stringify(req.query)
          const { moduleName } = req.params
          const apiPath = getApiBasePath(req)
          return `${apiPath}/ext/${moduleName}/${newPath}?${newQuery}`
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
      '/s/:name',
      proxy(coreApiUrl, {
        proxyReqPathResolver: req => {
          return `${BASE_PATH}/s/${req.params.name}`
        }
      })
    )

    app.post(
      '/api/modules/:moduleName/flow/:flowName/generate',
      proxy(coreApiUrl, {
        proxyReqPathResolver: req => {
          return `${BASE_PATH}/modules/${req.params.moduleName}/${req.params.flowName}/generate`
        }
      })
    )

    // TODO Hack for skill choice.. need to fix studio call url
    app.post(
      '/api/skills/skill-choice/generate',
      proxy(coreApiUrl, {
        proxyReqPathResolver: req => {
          return `${BASE_PATH}/modules/skill-choice/flow/choice/generate`
        }
      })
    )

    app.get(
      [`/js/modules/:moduleName`, `/js/modules/:moduleName/:subview`],
      proxy(coreApiUrl, {
        proxyReqPathResolver: (req, res) => {
          const moduleName = req.params.moduleName

          if (moduleName === 'web.bundle.js.map') {
            return undefined
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

  private setupAdminAppProxy({ httpProxy, coreApiUrl, app, proxyHost, proxyPort }) {
    const sanitizePath = path => path.replace('//', '/')

    app.get(
      '/api/license',
      proxy(coreApiUrl, {
        proxyReqPathResolver: async (req, res) => {
          return sanitizePath(`${BASE_PATH}/admin/license`)
        }
      })
    )

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
}
