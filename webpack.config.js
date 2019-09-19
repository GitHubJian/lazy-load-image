var version = '1.0.0'
var webpack = require('webpack')
var path = require('path')

module.exports = {
  target: 'web',
  mode: 'production',
  entry: {
    lazyload: './lib'
  },
  output: {
    filename: '[name]-' + version + '.min.js',
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
    library: '[name]',
    libraryTarget: 'window'
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env']]
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin({ NODE_ENV: 'production' }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
}
