var webpack = require('webpack')
var path = require('path')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var autoprefixer = require('autoprefixer')

var webConfig = {
  bail: true,
  devtool: 'source-map',
  entry: ['./src/web/index.jsx'],
  output: {
    path: './lib/web/js',
    publicPath: '/js/',
    filename: 'web.bundle.js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.css'],
    alias: {
      '~': path.resolve(__dirname, './src/web')
    }
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, './src/web/index.html'),
      to: path.resolve(__dirname, './lib/web/index.html')
    }, {
      from: path.resolve(__dirname, './src/web/img'),
      to: path.resolve(__dirname, './lib/web/img')
    }])
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/i,
      exclude: /node_modules/i,
      loader: 'babel-loader',
      query: {
        presets: ['latest', 'stage-0', 'react'],
        plugins: ['transform-object-rest-spread', 'transform-decorators-legacy'],
        compact: false,
        babelrc: false
      }
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]', 'postcss', 'sass']
    }, {
      test: /\.css$/,
      loaders: ['style', 'css']
    }, {
      test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
      loader: 'file?name=../fonts/[name].[ext]'
    }, {
      test: /\.json$/,
      loader: "json-loader"
    }]
  },
  postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ]
}


var compiler = webpack(webConfig)
var postProcess = function(err, stats) {
  if (err) throw err
  console.log(stats.toString('normal'))
}

if (process.argv.indexOf('--compile') !== -1) {
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}

module.exports = { web: webConfig }
