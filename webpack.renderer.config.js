const rules = require('./webpack.rules')
const plugins = require('./webpack.plugins')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
})

module.exports = {
  module: {
    rules,
  },
  // target: 'electron-renderer',
  plugins: plugins,
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
}
