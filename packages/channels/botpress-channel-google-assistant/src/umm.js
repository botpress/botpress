import _ from 'lodash'

import { GOOGLE_ASSISTANT } from './index'

const processOutgoing = () => ({})

const getTemplates = () => ({})

module.exports = bp => {
  const [renderers, registerConnector] = _.at(bp, ['renderers', 'renderers.registerConnector'])

  renderers &&
    registerConnector &&
    registerConnector({
      platform: GOOGLE_ASSISTANT,
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
