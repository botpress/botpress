import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Transition } from './typings'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
  return {
    transitions: createTransitions(data),
    flow: {
      nodes: [
        {
          name: 'entry',
          onEnter: [],
          next: [{ condition: 'true', node: '#' }]
        }
      ],
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = (data): Transition[] => {
  const transitions = data.intents.map(intent => {
    const node = intent.name ? `${intent.flow}#${intent.name}` : `${intent.flow}`
    return { caption: `On ${intent.intent}`, condition: `event.nlu.intent.name === "${intent.intent}"`, node }
  })
  transitions.push({ caption: 'No match found', condition: 'true', node: '' })
  return transitions
}

export default { generateFlow }
