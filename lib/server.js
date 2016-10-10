const express = require('express');
const chalk = require('chalk');
const path = require('path');
const Promise = require('bluebird');
const util = require('./util');

const serveStatic = function(app) {
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
        const gulp = require(path.join(__dirname, '../web/gulpfile'))
        gulp.skipLogs = true
        gulp.start('default')
        gulp.on('done', resolve)
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
    serveStatic(app)
    .then (function() {
      app.listen(3000, function() {
        util.print('success', '(web server) listening on port ' + chalk.bold('3000'))
      })
    })
  }

}

module.exports = WebServer;
