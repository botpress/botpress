var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var EventEmmiter = require('eventemitter2')
var _ = require('lodash');
var fs = require('fs');

var vendorConfig = require('../config/vendor.webpack.config.js')

var modulesTemplate = _.template("export const modules = {<%= modules %>}");
var moduleTemplate = _.template("'<%= name %>': require('#/<%= name %>/views/index.jsx').default");

var modulesMapPath = path.join(__dirname, '..', 'src/web/__modules.jsx')

module.exports = function(options) {
  var emitter = new EventEmmiter({ wildcard: true });

  var vendorCompiler = webpack(vendorConfig);

  if(options && options.modules) {
    var modules = _.values(options.modules).map(function(mod) {
      return moduleTemplate(mod)
    });
    var inner = modules.join(',');
    var modulesFile = modulesTemplate({ modules: inner });
    fs.writeFileSync(modulesMapPath, modulesFile);
  }

  vendorCompiler.run(function(err, stats) {
    if (err) return emitter.emit('error.vendor', err);
    emitter.emit('compiled.vendor');

    var appConfig = require('../config/app.webpack.config.js')
    appConfig.resolve.alias['#'] = path.join(options.projectLocation, 'node_modules')

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
