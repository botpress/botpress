const PRIVATE_MEMBER_SELECTOR = [
  'PropertyDefinition[accessibility="private"][computed=false]',
  'AccessorProperty[accessibility="private"][computed=false]',
  'MethodDefinition[accessibility="private"][computed=false]:not([kind="constructor"])',
].join(', ')

const PRIVATE_PARAMETER_PROPERTY_SELECTOR = 'TSParameterProperty[accessibility="private"]'

const CAMEL_CASE_AFTER_UNDERSCORE = /^_[a-z][a-zA-Z0-9]*$/

export default {
  meta: { name: 'naming', version: '1.0.0' },
  rules: {
    'private-member-underscore': {
      meta: {
        type: 'suggestion',
        docs: { description: 'Require a leading underscore and camelCase on private class members.' },
        schema: [],
        messages: {
          badName: "Private member '{{name}}' must be camelCase with a leading underscore.",
        },
      },
      create(context) {
        const reportBadName = (node) => {
          const name = node?.name
          if (typeof name === 'string' && !CAMEL_CASE_AFTER_UNDERSCORE.test(name)) {
            context.report({ node, messageId: 'badName', data: { name } })
          }
        }

        return {
          [PRIVATE_MEMBER_SELECTOR](node) {
            reportBadName(node.key)
          },
          [PRIVATE_PARAMETER_PROPERTY_SELECTOR](node) {
            // A parameter property with a default value wraps its name in an
            // assignment pattern.
            const parameter = node.parameter
            reportBadName(parameter?.type === 'AssignmentPattern' ? parameter.left : parameter)
          },
        }
      },
    },
  },
}
