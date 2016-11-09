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

import compiler from '../scripts/compile'

const setupSocket = function(app, skin) {
  const server = http.createServer(app)
  const io = socketio(server)

  if (skin.requiresAuth) {
    io.use(socketioJwt.authorize({
      secret: skin.getSecret(),
      handshake: true
    }))
  }

  io.on('connection', function(socket) {
    skin.logger.verbose('socket connected')

    socket.on('event', function(event) {
      skin.events.emit(event.name, event.data, 'client')
    })
  })

  skin.events.onAny(function(event, data, from) {
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

const serveApi = function(app, skin) {

  app.post('/api/login', (req, res, next) => {
    const result = skin.login(req.body.user, req.body.password, req.ip)
    res.send(result)
  })

  app.get('/api/*', authenticationMiddleware(skin))

  app.get('/api/ping', (req, res, next) => {
    res.send('pong')
  })

  app.get('/api/modules', (req, res, next) => {
    const modules = _.map(skin.modules, (module) => {
      return {
        name: module.name,
        homepage: module.homepage,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'icon-puzzle'
      }
    })
    res.send(modules)
  })

  app.get('/api/notifications', (req, res, next) => {
    res.send(skin.loadNotifications())
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
    skin.logger.query(options, (err, results) => {
      if (err) return console.log(err)
      res.send(results.file)
    })
  })

  app.get('/api/logs/archive', (req, res, next) => {
    skin.logger.archiveToFile()
    .then((archivePath) => {
      res.download(archivePath)
    })
  })

  const routers = {}
  skin.getRouter = function(name) {
    if (!routers[name]) {
      const router = express.Router()
      routers[name] = router
      app.use(`/api/${name}/`, router)
    }

    return routers[name]
  }
}

const serveStatic = function(app, skin) {

  for (let name in skin.modules) {
    const module = skin.modules[name]
    const bundlePath = path.join(module.root, module.settings.webBundle || 'bin/web.bundle.js')
    const requestPath = `/js/modules/${name}.js`
    
    app.use(requestPath, (req, res, next) => {
      try {
        const content = fs.readFileSync(bundlePath)
        res.contentType('text/javascript')  
        res.send(content)
      }
      catch (err) {
        skin.logger.warn('Could not serve module [' + name + '] at: ' + bundlePath)
      }
    })
  }

  app.use('/js/env.js', (req, res, next) => {
    res.contentType('text/javascript')
    res.send(`(function(window) {
      window.DEV_MODE = ${util.isDeveloping};
      window.AUTH_ENABLED = ${skin.requiresAuth};
      window.AUTH_TOKEN_DURATION = ${ms(skin.authTokenExpiry)};
    })(window || {})`)
  })

  app.use(express.static(path.join(__dirname, '../lib/web')))

  app.get('*', (req, res, next) => {
    if (/html/i.test(req.headers.accept)) {
      return res.sendFile(path.join(__dirname, '../lib/web/index.html'))
    }
    next()
  })

  if (!util.isDeveloping && !process.env.WATCH_CHANGES) {
    return Promise.resolve()
  }

  return Promise.resolve(true)
  // return new Promise(function(resolve, reject) {
  //   skin.logger.info('compiling website, please wait...')

  //     const landingPagePath = path.join(skin.projectLocation, 'ui/index.jsx')

  //     const events = compiler({
  //       watch: true,
  //       landingPagePath,
  //       projectLocation: skin.projectLocation,
  //       modules: skin.modules
  //     })

  //     events.on('error.*', (err) => {
  //       skin.logger.error('Error compiling website', err)
  //       reject(err)
  //     })

  //     events.on('compiled.app', resolve)
  // })
}

const authenticationMiddleware = (skin) => function(req, res, next) {
  if (!skin.requiresAuth) {
    return next()
  }

  if (skin.authenticate(req.headers.authorization)) {
    next()
  } else {
    res.status(401).location('/login').end()
  }
}

class WebServer {

  constructor({ skin }) {
    this.skin = skin
  }

  start() {
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    // TODO Add proxy trusting config
    // app.enable('trust proxy')

    const server = setupSocket(app, this.skin)
    serveApi(app, this.skin)
    serveStatic(app, this.skin)

    .then (() => {
      server.listen(3000, () => { // TODO Port in config

        for (var mod of _.values(this.skin.modules)) {
          mod.handlers.ready && mod.handlers.ready(this.skin)
        }

        this.skin.logger.info('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓')
        this.skin.logger.info('┃ bot launched, visit: http://localhost:3000 ┃')
        this.skin.logger.info('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛')
      })
    })
  }

}

module.exports = WebServer
