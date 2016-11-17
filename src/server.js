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
import util from './util'

const setupSocket = function(app, bp) {
  const server = http.createServer(app)
  const io = socketio(server)

  if (bp.requiresAuth) {
    io.use(socketioJwt.authorize({
      secret: bp.getSecret(),
      handshake: true
    }))
  }

  io.on('connection', function(socket) {
    bp.logger.verbose('socket connected')

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

  app.post('/api/login', (req, res, next) => {
    const result = bp.login(req.body.user, req.body.password, req.ip)
    res.send(result)
  })

  app.get('/api/*', authenticationMiddleware(bp))

  app.get('/api/ping', (req, res, next) => {
    res.send('pong')
  })

  app.get('/api/modules', (req, res, next) => {
    const modules = _.map(bp.modules, (module) => {
      return {
        name: module.name,
        homepage: module.homepage,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'view_module'
      }
    })
    res.send(modules)
  })

  app.get('/api/notifications', (req, res, next) => {
    res.send(bp.loadNotifications())
  })

  app.get('/api/logs', (req, res, next) => {
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

  app.get('/api/logs/archive', (req, res, next) => {
    bp.logger.archiveToFile()
    .then((archivePath) => {
      res.download(archivePath)
    })
  })

  const routers = {}
  bp.getRouter = function(name) {
    if (!routers[name]) {
      const router = express.Router()
      routers[name] = router
      app.use(`/api/${name}/`, router)
    }

    return routers[name]
  }
}

const serveStatic = function(app, bp) {

  for (let name in bp.modules) {
    const module = bp.modules[name]
    const bundlePath = path.join(module.root, module.settings.webBundle || 'bin/web.bundle.js')
    const requestPath = `/js/modules/${name}.js`
    
    app.use(requestPath, (req, res, next) => {
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

  app.use('/js/env.js', (req, res, next) => {
    res.contentType('text/javascript')
    res.send(`(function(window) {
      window.DEV_MODE = ${util.isDeveloping};
      window.AUTH_ENABLED = ${bp.requiresAuth};
      window.AUTH_TOKEN_DURATION = ${ms(bp.authTokenExpiry)};
    })(window || {})`)
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
  if (!bp.requiresAuth) {
    return next()
  }

  if (bp.authenticate(req.headers.authorization)) {
    next()
  } else {
    res.status(401).location('/login').end()
  }
}

class WebServer {

  constructor({ bp }) {
    this.bp = bp
  }

  start() {
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    // TODO Add proxy trusting config
    // app.enable('trust proxy')

    const server = setupSocket(app, this.bp)
    serveApi(app, this.bp)
    serveStatic(app, this.bp)
    
    server.listen(3000, () => { // TODO Port in config

      for (var mod of _.values(this.bp.modules)) {
        mod.handlers.ready && mod.handlers.ready(this.bp)
      }

      this.bp.logger.info('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓')
      this.bp.logger.info('┃ bot launched, visit: http://localhost:3000 ┃')
      this.bp.logger.info('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛')
    })
  }

}

module.exports = WebServer
