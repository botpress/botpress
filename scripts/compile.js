var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var EventEmmiter = require('eventemitter2')

var vendorConfig = require('../config/vendor.webpack.config.js')

module.exports = function(options) {
  var emitter = new EventEmmiter({ wildcard: true });

  var vendorCompiler = webpack(vendorConfig);

  vendorCompiler.run(function(err, stats) {
    if (err) return emitter.emit('error.vendor', err);
    emitter.emit('compiled.vendor');

    var appConfig = require('../config/app.webpack.config.js')
    var appCompiler = webpack(appConfig);

    var onAppCompiled = function(err, stats) {
      if (err) return emitter.emit('error.app', err);
      emitter.emit('compiled.app');
    };

    if(options && options.watch) {
      appCompiler.watch({}, onAppCompiled);
    } else {
      appCompiler.run(onAppCompiled);
    }

  });

  return emitter;
};
