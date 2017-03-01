import express from 'express'
import path from 'path'
import Promise from 'bluebird'
import _ from 'lodash'
import fs from 'fs'
import socketio from 'socket.io'
import socketioJwt from 'socketio-jwt'
import http from 'http'
import bodyParser from 'body-parser'
import ms from 'ms'
import chalk from 'chalk'
import uuid from 'uuid'
import sass from 'node-sass'

import util from './util'

const setupSocket = function(app, bp) {
  const server = http.createServer(app)
  const io = socketio(server)

  if (bp.botfile.login.enabled) {
    io.use(socketioJwt.authorize({
      secret: bp.security.getSecret(),
      handshake: true
    }))
  }

  io.on('connection', function(socket) {
    bp.stats.track('socket', 'connected')

    socket.on('event', function(event) {
      bp.events.emit(event.name, event.data, 'client')
    })
  })

  bp.events.onAny(function(event, data, from) {
    if (from === 'client') {
      // we sent this ourselves
      return
    }
    io.emit('event', {
      name: event,
      data: data
    })
  })

  return server
}

const serveApi = function(app, bp) {
  let logsSecret = uuid.v4()
  const routersConditions = {}
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
      } else if (typeof(condition) === 'function' && condition(req) === false) {
        next()
      } else {
        return fn(req, res, next)
      }
    }
  }

  app.use(maybeApply('bodyParser.json', bodyParser.json()))
  app.use(maybeApply('bodyParser.urlencoded', bodyParser.urlencoded({ extended: true })))

  app.post('/api/login', (req, res) => {
    bp.stats.track('api', 'auth', 'login')
    const result = bp.security.login(req.body.user, req.body.password, req.ip)
    res.send(result)
  })

  app.use('/api/*', maybeApply('auth', authenticationMiddleware(bp)))

  app.get('/api/ping', (req, res) => {
    res.send('pong')
  })

  app.get('/api/modules', (req, res) => {
    const modules = _.map(bp._loadedModules, (module) => {
      return {
        name: module.name,
        homepage: module.homepage,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'view_module',
        noInterface: !!module.settings.noInterface
      }
    })
    res.send(modules)
  })

  app.get('/api/middlewares', (req, res) => {
    res.send(bp.middlewares.list())
  })

  app.post('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    const { middlewares } = req.body
    bp.middlewares.setCustomizations(middlewares)
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.delete('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    bp.middlewares.resetCustomizations()
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.get('/api/notifications', (req, res) => {
    res.send(bp.notifications.load())
  })

  app.get('/api/bot/information', (req, res) => {
    res.send(bp.about.getBotInformation())
  })

  app.get('/api/module/all', (req, res) => {
    bp.modules.listAllCommunityModules()
    .then(modules => res.send(modules))
  })

  app.get('/api/module/popular', (req, res) => {
    bp.modules.listPopularCommunityModules()
    .then(popular => res.send(popular))
  })

  app.get('/api/module/featured', (req, res) => {
    bp.modules.listFeaturedCommunityModules()
    .then(featured => res.send(featured))
  })

  app.get('/api/module/hero', (req, res) => {
    bp.modules.getRandomCommunityHero()
    .then(hero => res.send(hero))
  })

  app.get('/api/bot/information', (req, res) => {
    res.send(bp.bot.getInformation())
  })

  app.get('/api/bot/production', (req, res) => {
    res.send(!util.isDeveloping)
  })

  app.get('/api/bot/contributor', (req, res) => {
    res.send(bp.bot.getContributor())
  })

  app.get('/api/license', (req, res) => {
    res.send(bp.licensing.getLicenses())
  })

  app.post('/api/license', (req, res) => {
    bp.stats.track('api', 'license', 'change')
    bp.licensing.changeLicense(req.body.license)
    .then(() => {
      res.sendStatus(200)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.post('/api/module/install/:name', (req, res) => {
    bp.stats.track('api', 'modules', 'install')
    const { name } = req.params
    bp.modules.install(name)
    .then(() => {
      res.sendStatus(200)
      bp.restart(1000)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.delete('/api/module/uninstall/:name', (req, res) => {
    bp.stats.track('api', 'modules', 'uninstall')
    const { name } = req.params
    bp.modules.uninstall(name)
    .then(() => {
      res.sendStatus(200)
      bp.restart(1000)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.delete('/api/guided-tour', (req, res) => {
    fs.unlink(path.join(bp.projectLocation, '.welcome'), () => {
      bp.isFirstRun = false
      res.sendStatus(200)
    })
  })

  app.get('/api/logs', (req, res) => {
    const options = {
      from: new Date() - 7 * 24 * 60 * 60 * 1000,
      until: new Date(),
      limit: (req.query && req.query.limit) || 50,
      start: 0,
      order: 'desc',
      fields: ['message', 'level', 'timestamp']
    }
    bp.logger.query(options, (err, results) => {
      if (err) return console.log(err)
      res.send(results.file)
    })
  })

  app.get('/api/logs/key', (req, res) => {
    res.send({ secret: logsSecret })
  })

  app.get('/logs/archive/:key', (req, res) => {
    bp.stats.track('api', 'logs', 'archive')
    if (req.params.key !== logsSecret) {
      return res.sendStatus(403)
    }

    bp.logger.archiveToFile()
    .then((archivePath) => {
      logsSecret = uuid.v4()
      res.download(archivePath)
    })
  })

  const routers = {}
  bp.getRouter = function(name, conditions) {

    if (!/^botpress-/.test(name)) {
      throw new Error('The name of a router must start with `botpress-`, but received: ' + name)
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

const serveStatic = function(app, bp) {

  for (let name in bp._loadedModules) {
    const module = bp._loadedModules[name]
    const bundlePath = path.join(module.root, module.settings.webBundle || 'bin/web.bundle.js')
    const requestPath = `/js/modules/${name}.js`

    if (module.settings.menuIcon === 'custom') {
      const iconRequestPath = `/img/modules/${name}.png`
      const iconPath = path.join(module.root, 'icon.png')

      app.use(iconRequestPath, (req, res) => {
        try {
          const content = fs.readFileSync(iconPath)
          res.contentType('image/png')
          res.send(content)
        }
        catch (err) {
          bp.logger.warn('Could not serve module icon [' + name + '] at: ' + iconPath)
        }
      })
    }

    app.use(requestPath, (req, res) => {
      try {
        const content = fs.readFileSync(bundlePath)
        res.contentType('text/javascript')
        res.send(content)
      }
      catch (err) {
        bp.logger.warn('Could not serve module [' + name + '] at: ' + bundlePath)
      }
    })
  }

  app.use('/js/env.js', (req, res) => {
    const { tokenExpiry, enabled } = bp.botfile.login
    const optOutStats = !!bp.botfile.optOutStats
    const { isFirstRun, version } = bp
    res.contentType('text/javascript')
    res.send(`(function(window) {
      window.NODE_ENV = "${process.env.NODE_ENV || 'development'}";
      window.DEV_MODE = ${util.isDeveloping};
      window.AUTH_ENABLED = ${enabled};
      window.AUTH_TOKEN_DURATION = ${ms(tokenExpiry)};
      window.OPT_OUT_STATS = ${optOutStats};
      window.SHOW_GUIDED_TOUR = ${isFirstRun};
      window.BOTPRESS_VERSION = "${version}";
    })(window || {})`)
  })

  let customTheme = ''
  const themeLocation = path.join(bp.projectLocation, 'theme.scss')
  if (fs.existsSync(themeLocation)) {
    const content = fs.readFileSync(themeLocation)
    const compile = sass.renderSync({ data: `#app {${content}}` })
    customTheme = compile.css.toString()
  }

  app.use('/style/custom-theme.css', (req, res) => {
    res.contentType('text/css')
    res.send(customTheme)
  })

  app.use(express.static(path.join(__dirname, '../lib/web')))

  app.get('*', (req, res, next) => {
    if (/html/i.test(req.headers.accept)) {
      return res.sendFile(path.join(__dirname, '../lib/web/index.html'))
    }
    next()
  })

  return Promise.resolve(true)
}

const authenticationMiddleware = (bp) => function(req, res, next) {
  if (!bp.botfile.login.enabled) {
    return next()
  }

  if (bp.security.authenticate(req.headers.authorization)) {
    next()
  } else {
    res.status(401).location('/login').end()
  }
}

class WebServer {

  constructor({ botpress }) {
    this.bp = botpress
  }

  start() {
    const app = express()
    const server = setupSocket(app, this.bp)
    const port = this.bp.botfile.port || 3000
    serveApi(app, this.bp)
    serveStatic(app, this.bp)

    server.listen(port, () => {
      this.bp.events.emit('ready')
      for (var mod of _.values(this.bp._loadedModules)) {
        mod.handlers.ready && mod.handlers.ready(this.bp, mod.configuration)
      }

      this.bp.logger.info(chalk.green.bold('bot launched, visit: http://localhost:' + port))
    })
  }

}

module.exports = WebServer
