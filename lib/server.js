const express = require('express')
const chalk = require('chalk')
const path = require('path')
const Promise = require('bluebird')
const util = require('./util')
const _ = require('lodash')

const serveApi = function(app, skin) {
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
      util.print('(dev mode) Compiling website...')
      try {
        process.chdir(path.join(__dirname, '../web'))
        const Tasks = require(path.join(__dirname, '../web/tasks'))
        const modules = _.map(_.values(skin.modules), (mod) => {
          return { name: mod.name, path: `${mod.root}/views/**.*` }
        })
        const gulp = Tasks({ modules, skipLogs: true })
        gulp.on('done', resolve)
        gulp.on('error', (err) => {
          util.print('err', '(gulp) ' + err)
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

class WebServer {

  constructor({ skin }) {
    this.skin = skin
  }

  start() {
    const app = express()

    serveApi(app, this.skin)
    serveStatic(app, this.skin)

    .then (function() {
      app.listen(3000, function() {
        util.print('success', '(web server) listening on port ' + chalk.bold('3000'))
      })
    })
  }

}

module.exports = WebServer;
