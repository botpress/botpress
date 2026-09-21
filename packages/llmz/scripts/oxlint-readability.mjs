const BLOCK_STATEMENTS = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'TryStatement',
  'TSTypeAliasDeclaration',
  'TSInterfaceDeclaration',
  'ClassDeclaration',
  'FunctionDeclaration',
])

export default {
  meta: { name: 'llmz-style', version: '1.0.0' },
  rules: {
    'readable-statements': {
      meta: {
        type: 'layout',
        fixable: 'whitespace',
        schema: [],
        messages: {
          separate: 'Write each statement on its own line.',
          spacing: 'Separate this control-flow block from the next logical step with a blank line.',
        },
      },
      create(context) {
        const source = context.sourceCode
        const checkStatements = (node) => {
          const statements = node.body

          for (let index = 1; index < statements.length; index++) {
            const previous = statements[index - 1]
            const current = statements[index]
            const between = source.text.slice(previous.range[1], current.range[0])
            const sameLine = previous.loc.end.line === current.loc.start.line
            const missingBlankLine = BLOCK_STATEMENTS.has(previous.type) && !/\n\s*\n/.test(between)

            if (!sameLine && !missingBlankLine) {
              continue
            }

            context.report({
              node: current,
              messageId: sameLine ? 'separate' : 'spacing',
              fix(fixer) {
                const spacing = sameLine && !BLOCK_STATEMENTS.has(previous.type) ? '\n' : '\n\n'
                return fixer.insertTextAfter(previous, spacing)
              },
            })
          }
        }

        return {
          Program: checkStatements,
          BlockStatement: checkStatements,
        }
      },
    },
  },
}
