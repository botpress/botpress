const express = require('express')
const chalk = require('chalk')
const path = require('path')
const Promise = require('bluebird')
const _ = require('lodash')
const socketio = require('socket.io')
const socketioJwt = require('socketio-jwt')
const http = require('http')
const bodyParser = require('body-parser')

const util = require('./util')

const setupSocket = function(app, skin) {
  const server = http.createServer(app)
  const io = socketio(server)

  if(skin.requiresAuth) {
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
    if(from === 'client') {
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
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'icon-puzzle'
      }
    })
    res.send(modules)
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
}

const serveStatic = function(app, skin) {
  app.use(express.static(path.join(__dirname, '../web/dist')))

  app.get('*', (req, res, next) => {
    if(/html/i.test(req.headers.accept)) {
      return res.sendFile(path.join(__dirname, '../web/dist/index.html'))
    }
    next()
  })

  if (util.isDeveloping) {
    return new Promise(function(resolve, reject) {
      // backup current working directory
      const cwd = process.cwd()
      skin.logger.verbose('compiling website...')
      try {
        process.chdir(path.join(__dirname, '../web'))
        const Tasks = require(path.join(__dirname, '../web/tasks'))
        const modules = _.map(_.values(skin.modules), (mod) => {
          return { name: mod.name, path: `${mod.root}/views/**.*` }
        })
        const gulp = Tasks({ modules, skipLogs: true })
        gulp.on('done', resolve)
        gulp.on('error', (err) => {
          skin.logger.error('Gulp error', err)
        })

        gulp.start('default')
      }
      catch (err) {
        reject(err)
      }
      finally {
        // restore initial working directory
        process.chdir(cwd);
      }
    })
  } else {
    return Promise.resolve()
  }
}

const authenticationMiddleware = (skin) => function(req, res, next) {
  if(!skin.requiresAuth) {
    return next()
  }

  if(skin.authenticate(req.headers.authorization)) {
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
        this.skin.logger.info('listening on port 3000')
      })
    })
  }

}

module.exports = WebServer;
