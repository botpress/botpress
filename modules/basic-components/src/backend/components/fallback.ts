import * as sdk from 'botpress/sdk'
import { uniqueId } from 'lodash'
import { prettyId } from './utils'

const FLOW_CHOICE_NAME = `choice_multi_${prettyId()}.flow.json`
const generateFlow = async (): Promise<any> => {
  return {
    transitions: createTransitions(),
    flow: {
      nodes: createNodes(),
      catchAll: {
        next: []
      },
      version: '0.0.1',
      startNode: 'entry'
    },
    skills: skillsFlow()
  }
}

const createNodes = () => {
  // cat main.flow.json | jq '.nodes | .[] | select(has("skill") | not)'
  const nodes: any[] = [
    {
      id: '8e29fd10d4',
      name: 'catch_from_free_text',
      next: [
        {
          condition: "event.nlu.intent.name === ''",
          conditionType: 'intent',
          node: 'END'
        },
        {
          condition: 'true',
          node: 'did_not_understand'
        }
      ],
      onEnter: [],
      onReceive: null,
      type: 'standard'
    },
    {
      id: 'e629bb5b7b',
      name: 'did_not_understand',
      next: [
        {
          condition: 'true',
          node: 'choice-b8edc4'
        }
      ],

      onEnter: [
        {
          contentType: 'builtin_text',
          formData: {
            text$en: '  I’m sorry, I didn’t get that. Please rephrase or select one of the  options',
            markdown$en: true,
            typing$en: true
          }
        }
      ],
      onReceive: null,
      type: 'standard'
    },
    {
      id: 'skill-b8edc4',
      type: 'skill-call',
      skill: 'choice',
      name: 'choice-b8edc4',
      flow: 'skills/choice-b8edc4.flow.json',
      next: [
        {
          caption: 'User picked [option_1]',
          condition: 'temp[\'skill-choice-ret-l9l0w91u0a\'] == "option_1"',
          node: ''
        },
        {
          caption: 'User picked [option_2]',
          condition: 'temp[\'skill-choice-ret-l9l0w91u0a\'] == "option_2"',
          node: ''
        },
        {
          caption: 'User picked [option_3]',
          condition: 'temp[\'skill-choice-ret-l9l0w91u0a\'] == "option_3"',
          node: ''
        },
        {
          caption: 'On failure',
          condition: 'true',
          node: 'catch_from_free_text'
        }
      ],
      onEnter: null,
      onReceive: null
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

const skillsFlow = () => {
  const flow: any[] = [
    {
      startNode: 'choice-multi',
      flow: `${FLOW_CHOICE_NAME}`,
      location: `skills/${FLOW_CHOICE_NAME}`,
      skill: 'choice',
      name: 'choice-multi',
      skillData: {
        randomId: prettyId(),
        invalidContentId: '',
        keywords: {
          option_1: ['option_1', 'Option 1'],
          option_2: ['option_2', 'Option 2'],
          option_3: ['option_3', 'Option 3']
        },
        config: {
          nbMaxRetries: 3,
          repeatChoicesOnInvalid: false,
          variableName: ''
        }
      }
    }
  ]
  return flow
}

export default { generateFlow }
