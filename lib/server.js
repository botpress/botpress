const express = require('express');
const chalk = require('chalk');
const path = require('path');

const util = require('./util');

const isDeveloping = process.env.NODE_ENV !== 'production';

const serveStatic = function(app) {
  app.use(express.static(path.join(__dirname, '../web/dist')));

  if (isDeveloping) {
    const cwd = process.cwd()
    try {
      process.chdir(path.join(__dirname, '../web'))
      const gulp = require(path.join(__dirname, '../web/gulpfile'))
      gulp.start('default');
    }
    finally{
      process.chdir(cwd);
    }
  }
}

class WebServer {

  constructor({ skin }) {
    this.skin = skin;
  }

  start() {
    const app = express();
    serveStatic(app);

    app.listen(3000, function() {
      util.print('success', '(web server) listening on port ' + chalk.bold('3000'));
    });
  }

}

module.exports = WebServer;
