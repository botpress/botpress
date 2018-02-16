import _ from 'lodash'
import bodyParser from 'body-parser'
import { Router } from 'express'
import qs from 'query-string'

import ServiceLocator from '+/ServiceLocator'
import anonymousApis from './anonymous'
import securedApis from './secured'

const routersConditions = {}
const routers = {}

const maybeApply = (name, fn) => {
  return (req, res, next) => {
    const router = req.originalUrl.match(/\/api\/(botpress-[^\/]+).*$/i)
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

  const installProtector = app => {
    app.secure = (operation, ressource) => {
      const wrap = method => (name, ...handlers) => {
        const secure = async (req, res, next) => {
          try {
            if (!req.user) {
              return next()
            }

            const authorizeApi = await ServiceLocator.getService('authorizeApi', false)

            if (!authorizeApi) {
              return next()
            }

            const authorized = await authorizeApi({ userId: req.user.id, operation, ressource })

            if (authorized) {
              return next()
            }

            return res.sendStatus(403) // HTTP Forbidden
          } catch (err) {
            return res.status(500).send({ message: err.message })
          }
        }

        return app[method](name, secure, ...handlers)
      }

      return {
        get: wrap('get'),
        post: wrap('post'),
        put: wrap('put'),
        delete: wrap('delete')
      }
    }
  }

  const installRouter = app => {
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

    bp.createShortlink = (name, destination, params) => {
      name = name.toLowerCase()

      if (links[name]) {
        throw new Error(`There's already a shortlink named "${name}"`)
      }

      const q = params ? '?' + qs.stringify(params) : ''
      links[name] = `${destination}${q}`
    }

    app.use(`/s/:name`, (req, res) => {
      const name = req.params.name.toLowerCase()

      if (!links[name]) {
        return res.status(404).send({ error: `Shortlink "${name}" not registered` })
      }

      res.redirect(links[name])
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

    securedApis(bp, app)
  }

  return { install }
}
