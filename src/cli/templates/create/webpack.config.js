const path = require('path')
const nodeExternals = require('webpack-node-externals')
const pkg = require('./package.json')

const cleanVersion = semver => semver.replace(/[>=]/g, '')

const commonConfig = {
  context: path.resolve(__dirname, 'src'),
  devtool: 'source-map',
  stats: 'minimal'
}

const nodeConfig = Object.assign({}, commonConfig, {
  entry: ['./index.js'],
  output: {
    path: path.resolve(__dirname, 'bin'),
    filename: 'node.bundle.js',
    libraryTarget: 'commonjs2',
    library: ['botpress', pkg.name]
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules']
  },
  externals: [nodeExternals(), 'botpress'],
  target: 'node',
  node: {
    __filename: false,
    __dirname: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceMaps: true,
            presets: [
              [
                'env',
                {
                  targets: {
                    node: cleanVersion(pkg.engines.node)
                  }
                }
              ]
            ],
            plugins: ['transform-object-rest-spread', 'add-module-exports']
          }
        }
      }
    ]
  }
})

const webConfig = Object.assign({}, commonConfig, {
  entry: ['./views/index.jsx'],
  output: {
    path: path.resolve(__dirname, 'bin'),
    publicPath: '/js/modules/',
    filename: 'web.bundle.js',
    libraryTarget: 'assign',
    library: ['botpress', pkg.name]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              'react',
              [
                'env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 10']
                  }
                }
              ]
            ],
            plugins: ['transform-object-rest-spread']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: pkg.name + '__[name]__[local]___[hash:base64:5]'
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        use: {
          loader: 'file-loader',
          options: {
            name: '../fonts/[name].[ext]'
          }
        }
      }
    ]
  }
})

// eslint-disable-next-line no-unused-vars
const liteConfig = Object.assign({}, webConfig, {
  // Add your lite views here, see example below
  context: path.resolve(__dirname, 'src'),
  entry: {
    // example: './views/example.lite.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'bin/lite'),
    publicPath: '/js/lite-modules/',
    filename: '[name].bundle.js',
    libraryTarget: 'assign',
    library: ['botpress', pkg.name]
  }
})

module.exports = [nodeConfig, webConfig /*, liteConfig*/]
