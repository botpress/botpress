const webpack = require('webpack')
const path = require('path')

module.exports = function(options) {
  const { moduleRoot } = options
  const pkg = require(path.join(moduleRoot, './package.json'))

  const webConfig = {
    devtool: 'source-map',
    entry: ['./src/views/index.jsx'],
    output: {
      path: path.resolve(moduleRoot, './dist/web'),
      publicPath: '/js/modules/',
      filename: 'web.bundle.js',
      libraryTarget: 'assign',
      library: ['botpress', pkg.name]
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-bootstrap': 'ReactBootstrap'
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['latest', 'stage-0', 'react'],
              plugins: ['transform-object-rest-spread', 'transform-decorators-legacy']
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: pkg.name + '__[name]__[local]___[hash:base64:5]'
              }
            },
            { loader: 'sass-loader' }
          ]
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
        },
        {
          test: /font.*\.(woff|woff2|svg|eot|ttf)$/,
          use: { loader: 'file-loader', options: { name: '../fonts/[name].[ext]' } }
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          use: [{ loader: 'file-loader', options: { name: '[name].[hash].[ext]' } }, { loader: 'image-webpack-loader' }]
        }
      ]
    }
  }

  const liteConfig = Object.assign({}, webConfig, {
    entry: {
      embedded: './src/views/web/embedded.jsx',
      fullscreen: './src/views/web/fullscreen.jsx'
    },
    output: {
      path: path.resolve(moduleRoot, './dist/web'),
      publicPath: '/js/lite-modules/',
      filename: '[name].bundle.js',
      libraryTarget: 'assign',
      library: ['botpress', pkg.name]
    }
  })

  return { full: webConfig, lite: liteConfig }
}

// var compiler = webpack([webConfig, liteConfig])
// var postProcess = function(err, stats) {
//   if (err) {
//     throw err
//   }
//   console.log(stats.toString('minimal'))
// }

// if (process.argv.indexOf('--compile') !== -1) {
//   compiler.run(postProcess)
// } else if (process.argv.indexOf('--watch') !== -1) {
//   compiler.watch(null, postProcess)
// }
