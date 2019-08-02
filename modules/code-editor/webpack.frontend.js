const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = ({ full, lite }) => {
  full = {
    ...full,
    output: {
      ...full.output,
      publicPath: 'assets/modules/code-editor/web/'
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
          'parameterHints',
          'quickCommand',
          'quickOutline',
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
