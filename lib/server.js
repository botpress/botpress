const express = require('express');
const chalk = require('chalk');
const path = require('path');

const util = require('./util');

const isDeveloping = process.env.NODE_ENV !== 'production';

const serveStatic = function(app) {

  if (!isDeveloping) {
    return app.use(express.static(path.join(__dirname, '../web/dist')));
  }

  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const config = require(path.join(__dirname, '../webpack.config.dev.js'));

  // console.log(config.output.publicPath);
  const compiler = webpack(config);
  console.log(config)
  const middleware = webpackMiddleware(compiler, {
    watchOptions: {
      poll: true,
      aggregateTimeout: 300
    },
    stats: { colors: true }
  });

  app.use(middleware);
  // app.use(webpackHotMiddleware(compiler));

  // const web = path.join(__dirname, '../web/dist');
  // app.use('/',express.static(web));

  util.print('serving development website using webpack');
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
