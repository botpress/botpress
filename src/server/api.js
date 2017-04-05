import _ from 'lodash'
import bodyParser from 'body-parser'
import express from 'express'

import anonymousApis from './anonymous'
import securedApis from './secured'

const routersConditions = {}
const routers = {}

module.exports = bp => {

  async function _authenticationMiddleware(req, res, next) {
    if (!bp.botfile.login.enabled) {
      return next()
    }

    if (await bp.security.authenticate(req.headers.authorization)) {
      next()
    } else {
      res.status(401).location('/login').end()
    }
  }

  function installRouter(app) {
    bp.getRouter = function(name, conditions) {
      if (!/^botpress-/.test(name)) {
        throw new Error(`The name of a router must start with 'botpress-'. Received: ${name}`)
      }

      if (!routers[name]) {
        const router = express.Router()
        routers[name] = router
        app.use(`/api/${name}/`, router)
      }

      if (conditions) {
        routersConditions[name] = Object.assign(routersConditions[name] || {}, conditions)
      }

      return routers[name]
    }
  }

  function installProtector(app) {
    app.secure = function(operation, res) {

      const wrap = method => function(name, handler) {
        return app[method].call(name, function(req, res, next) {

          // TODO Default protection here

          handler(req, res, next)
        })
      }

      return { 
        get: wrap('get')
      }
    }
  }

  function installMaybeUse(app) {
    app.maybeUse = function() {
      if (arguments.length === 3) {
        app.use(arguments[0], maybeApply(arguments[1], arguments[2]))
      } else if (arguments.length === 2) {
        app.use(maybeApply(arguments[0], arguments[1]))
      }
    }
  }

  async function install(app) {
    installRouter(app)
    installProtector(app)
    installMaybeUse(app)

    app.maybeUse('bodyParser.json', bodyParser.json())
    app.maybeUse('bodyParser.urlencoded', bodyParser.urlencoded({ extended: true }))

    anonymousApis(bp, app)

    app.use('/api/*', maybeApply('auth', _authenticationMiddleware))

    securedApis(bp, app)
  }

  return { install }
}

function maybeApply(name, fn) {
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
    } else if (typeof(condition) === 'function' && condition(req) === false) {
      next()
    } else {
      return fn(req, res, next)
    }
  }
}
