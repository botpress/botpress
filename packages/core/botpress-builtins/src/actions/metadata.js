import _ from 'lodash'
import * as actions from './index'

const metadata = _.mapValues(actions, action => {
  try {
    const description = action(null, null, 'bp::describe-action')
    if (description) {
      const params = _.keys(description.children).filter(x => !x.startsWith('__'))
      const metadata = {
        title: _.get(description, 'children.__title.description'),
        description: _.get(description, 'children.__description.description'),
        category: _.get(description, 'children.__category.description'),
        params: []
      }

      for (const key of params) {
        const flags = description.children[key].flags
        const required = flags && flags.presence === 'required'
        const def = flags && flags.default

        metadata.params.push({
          description: description.children[key].description,
          name: key,
          required,
          default: def,
          type: description.children[key].type
        })
      }

      return metadata
    }
  } catch (err) {}

  return null
})

export default metadata
