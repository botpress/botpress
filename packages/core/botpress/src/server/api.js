import _ from 'lodash'
import bodyParser from 'body-parser'
import { Router } from 'express'
import qs from 'query-string'
import { checkMultipleRoles } from '@botpress/util-roles'

import anonymousApis from './anonymous'
import nonSecuredApis from './non-secured'
import securedApis from './secured'

const routersConditions = {}
const routers = {}

const API_RE = /\/api\/(botpress-[^\/]+).*$/i

const maybeApply = (name, fn) => {
  return (req, res, next) => {
    const router = req.originalUrl.match(API_RE)
    if (!router) {
      return fn(req, res, next)
    }

    if (!routersConditions[router[1]]) {
      return fn(req, res, next)
    }

    const condition = routersConditions[router[1]][name]
    if (condition === false) {
      next()
    } else if (typeof condition === 'function' && condition(req) === false) {
      next()
    } else {
      return fn(req, res, next)
    }
  }
}

module.exports = bp => {
  const _authenticationMiddleware = async (req, res, next) => {
    res.maybeSendRequireLogin = () => {
      if (!bp.botfile.login.enabled) {
        res.status(400).send({
          message: 'Login must be turned on for this API method'
        })

        return true
      } else {
        return false
      }
    }

    if (!bp.botfile.login.enabled) {
      return next()
    }

    const user = await bp.security.authenticate(req.headers.authorization)
    if (!!user) {
      req.user = user
      next()
    } else {
      res
        .status(401)
        .location('/login')
        .end()
    }
  }

  const getCloudRoles = async req => {
    const { useCloud, enabled } = bp.botfile.login
    const isUsingCloud = !!useCloud && (await bp.cloud.isPaired())
    if (!isUsingCloud || !enabled) {
      // No cloud, skip check
      return false
    }
    const { roles } = req.user || {}
    if (!roles) {
      return null
    }
    return bp.cloud.getUserRoles(roles)
  }

  const installProtector = app => {
    app.secure = (operation, resource) => {
      const wrap = method => (route, ...handlers) => {
        const secureMiddleware = async (req, res, next) => {
          try {
            const roles = await getCloudRoles(req)

            if (roles === false) {
              return next()
            }

            if (!checkMultipleRoles(roles, operation, resource)) {
              return res.sendStatus(403) // Forbidden
            }

            return next()
          } catch (err) {
            return res.status(500).send({ message: err.message })
          }
        }

        return app[method](route, secureMiddleware, ...handlers)
      }

      return {
        get: wrap('get'),
        post: wrap('post'),
        put: wrap('put'),
        patch: wrap('patch'),
        delete: wrap('delete')
      }
    }
  }

  const installRouter = app => {
    /**
     * Creates an HTTP [Express Router]{@link https://expressjs.com/} that is protected by authentication
     * The router routes are available at "http://bot_url/api/:name"
     * Where `name` is a string starting with `botpress-`
     * @func
     * @alias getRouter
     * @memberOf! Botpress
     * @param  {String} name       The name of the router. Must start with `botpress-`
     * @param  {object=} [conditions] See examples. Conditionally disables built-in Botpress middlewares.
     * @example
     * const securedRouter = bp.getRouter('botpress-custom')
     * const publicRouter = bp.getRouter('botpress-custom', { auth: false })
     *
     * // Conditions can also be used like below
     * const conditions = { 'auth': req => !/\/webhook/i.test(req.originalUrl) }
     * const conditionalAuthentication = bp.getRouter('botpress-custom', conditions)
     */
    bp.getRouter = (name, conditions) => {
      if (!/^botpress-/.test(name)) {
        throw new Error(`The name of a router must start with 'botpress-'. Received: ${name}`)
      }

      if (!routers[name]) {
        const router = Router()
        routers[name] = router
        app.use(`/api/${name}/`, router)
      }

      if (conditions) {
        routersConditions[name] = Object.assign(routersConditions[name] || {}, conditions)
      }

      installProtector(routers[name])
      return routers[name]
    }

    const links = {}

    /**
     * Creates a short link for a specific API route, making it easier to share, more verbose and elegant.
     * Short links are available as `http://bot_url/s/{name}`
     * @alias  createShortlink
     * @param  {String} name        Unique, url-friendly name of the short link
     * @param  {String} destination The original route to redirect to
     * @param  {Object} params      Query parameters to pass the route. Will be serialized.
     * @memberof! Botpress
     * @example
     *   const config = {
  botName: 'Superbot',
  botConvoDescription: "Tell me something!",
  backgroundColor: '#ffffff'
}

// Visiting "http://bot_url/s/chat" will display the webchat in fullscreen
bp.createShortlink('chat', '/lite', {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({ config: config })
})
     */
    bp.createShortlink = (name, destination, params) => {
      name = name.toLowerCase()

      if (links[name]) {
        throw new Error(`There's already a shortlink named "${name}"`)
      }

      const q = params ? '?' + qs.stringify(params) : ''
      links[name] = `${destination}${q}`
    }

    app.get(`/s/:name`, (req, res) => {
      const name = req.params.name.toLowerCase()
      const query = qs.stringify(req.query)
      let link = links[name]

      if (!link) {
        return res.status(404).send({ error: `Shortlink "${name}" not registered` })
      }

      if (query) {
        const hasQuery = /\?/g.test(link)
        link = link.concat(`${hasQuery ? '&' : '?'}${query}`)
      }

      res.redirect(link)
    })
  }

  const installMaybeUse = app => {
    app.maybeUse = function() {
      if (arguments.length === 3) {
        app.use(arguments[0], maybeApply(arguments[1], arguments[2]))
      } else if (arguments.length === 2) {
        app.use(maybeApply(arguments[0], arguments[1]))
      }
    }
  }

  const install = async app => {
    installRouter(app)
    installProtector(app)
    installMaybeUse(app)

    app.maybeUse('bodyParser.json', bodyParser.json({ limit: _.get(bp.botfile, 'api.bodyMaxSize') || '1mb' }))
    app.maybeUse('bodyParser.urlencoded', bodyParser.urlencoded({ extended: true }))

    anonymousApis(bp, app)

    app.use('/api/*', maybeApply('auth', _authenticationMiddleware))

    nonSecuredApis(bp, app)
    securedApis(bp, app)
  }

  return { install }
}
