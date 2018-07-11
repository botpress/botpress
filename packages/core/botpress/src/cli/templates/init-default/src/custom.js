const _ = require('lodash')
const path = require('path')
const jsdoc = require('jsdoc-api')

const renderers = require('./renderers')

// If you want to split your actions into multiple files
// Add the extra files here
const actionFiles = ['./actions.js']

module.exports = async bp => {
  await registerRenderers(bp)
  await registerActions(bp)
}

async function registerActions(bp) {
  const metadata = {}
  bp.dialogEngine.registerActionMetadataProvider(action => metadata[action])

  for (const actionFile of actionFiles) {
    const docs = await jsdoc.explain({ files: path.join(__dirname, actionFile) })
    const actions = require(actionFile)

    for (const action of Object.keys(actions)) {
      const meta = docs.find(doc => {
        return doc.name === action && doc.comment.length > 0
      })

      if (meta) {
        metadata[action] = {
          title: meta.name,
          description: meta.description,
          category: 'Custom',
          params: meta.params.map(param => ({
            type: _.get(param, 'type.names.0') || 'string',
            name: param.name.replace('params.', ''),
            description: param.description,
            default: param.defaultvalue || '',
            required: !param.optional
          }))
        }
      }
    }

    bp.dialogEngine.registerActions(actions)
  }
}

async function registerRenderers(bp) {
  // Register all your custom Content Renderers
  Object.keys(renderers).forEach(name => {
    bp.renderers.register(name, renderers[name])
  })
}
