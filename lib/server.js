const express = require('express');
const chalk = require('chalk');
const path = require('path');

const util = require('./util');

class WebServer {

  constructor({ skin }) {
    this.skin = skin;
  }

  start() {
    const app = express();

    const webappPath = path.join(__dirname, '..', 'web/dist');
    app.use(express.static(webappPath));

    app.listen(3000, function() {
      util.print('success', '(web server) listening on port ' + chalk.bold('3000'));
    });
  }

}

module.exports = WebServer;
