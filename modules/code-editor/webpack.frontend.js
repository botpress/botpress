const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = ({ full, lite }) => {
  full = {
    ...full,
    output: {
      ...full.output,
      publicPath: 'assets/modules/code-editor/web/'
    },
    module: {
      ...full.module,
      rules: [
        ...full.module.rules,
        {
          test: /\.ttf$/,
          use: ['file-loader']
        }
      ]
    },
    plugins: [
      ...full.plugins,
      new MonacoWebpackPlugin({
        languages: ['json', 'javascript', 'typescript'],
        features: [
          'bracketMatching',
          'colorDetector',
          'comment',
          'codelens',
          'contextmenu',
          'coreCommands',
          'clipboard',
          'dnd',
          'find',
          'folding',
          'format',
          'goToDefinitionCommands',
          'goToDefinitionMouse',
          'gotoLine',
          'hover',
          'inPlaceReplace',
          'links',
          'onTypeRename',
          'parameterHints',
          'quickCommand',
          'quickOutline',
          'rename',
          'smartSelect',
          'suggest',
          'wordHighlighter',
          'wordOperations',
          'wordPartOperations'
        ]
      })
    ]
  }

  return [full, lite]
}
