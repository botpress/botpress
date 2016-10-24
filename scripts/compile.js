var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var vendorConfig = require('../config/vendor.webpack.config.js')

module.exports = function() {

  var vendorCompiler = webpack(vendorConfig);

  vendorCompiler.run(function(err, stats) {
    console.log(err ? 'vendor:ERROR' : 'vendor:SUCCESS');

    var appConfig = require('../config/app.webpack.config.js')
    var appCompiler = webpack(appConfig);

    appCompiler.watch({}, function(err, stats) {
      if (err) console.log(err, err.message)
      console.log(err ? 'app:ERROR' : 'app:SUCCESS');
    });

  });
};
