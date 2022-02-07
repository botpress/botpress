import * as sdk from 'botpress/sdk'
import { uniqueId } from 'lodash'
import { prettyId } from './utils'

const generateFlow = async (): Promise<sdk.FlowGenerationResult> => {
  return {
    transitions: createTransitions(),
    flow: {
      nodes: createNodes(),
      catchAll: {
        onReceive: [],
        next: []
      }
    }
  }
}

const createNodes = () => {
  const nodes: any[] = [
    {
      id: prettyId(),
      name: 'entry',
      next: [
        {
          condition: 'event.state.session.greeted',
          conditionType: 'raw',
          node: 'your_next_node'
        },
        {
          condition: 'true',
          conditionType: 'always',
          node: 'store_greeting'
        }
      ],
      onEnter: [],
      onReceive: null
    },
    {
      id: prettyId(),
      name: 'store_greeting',
      next: [
        {
          condition: 'true',
          conditionType: 'always',
          node: 'Greeting'
        }
      ],
      onEnter: ['builtin/setVariable {"type":"session","name":"greeted","value":"true"}'],
      onReceive: null,
      type: 'standard'
    },
    {
      id: prettyId(),
      name: 'Greeting',
      next: [
        {
          condition: 'true',
          node: ''
        }
      ],
      onEnter: [
        {
          contentType: 'builtin_text',
          formData: {
            text$en: "Hello I'm your conversation A.I. I was built to say hello to you.  one time",
            markdown$en: true,
            typing$en: true
          }
        }
      ],
      onReceive: null,
      type: 'standard'
    },
    {
      id: prettyId(),
      name: 'your_next_node',
      next: [
        {
          condition: 'true',
          node: ''
        }
      ],
      onEnter: [],
      onReceive: null,
      type: 'standard'
    }
  ]
  return nodes
}

const createTransitions = (): sdk.NodeTransition[] => {
  const keySuffix = uniqueId()

  return [
    { caption: 'On success', condition: `temp.valid${keySuffix}`, node: '' },
    { caption: 'On failure', condition: `!temp.valid${keySuffix}`, node: '' }
  ]
}

export default { generateFlow }
