import * as sdk from 'botpress/sdk'
import { uniqueId } from 'lodash'
import { prettyId } from './utils'

let FLOW_API_NAME = ''
let FLOW_CHOICE_NAME = ''

const generateFlow = async (): Promise<any> => {
  FLOW_API_NAME = `call_from_previous_answer_${prettyId()}.flow.json`
  FLOW_CHOICE_NAME = `show_output_api_${prettyId()}.flow.json`
  // Return normal flow and skill flow. I need to do this. Because skills need to be created
  return {
    transitions: createTransitions(),
    flow: {
      nodes: createNodes(),
      catchAll: {
        onReceive: [],
        next: []
      },
      version: '0.0.1',
      startNode: 'entry'
    },
    skills: skillsFlow()
  }
}

const createNodes = () => {
  const nodes: any[] = [
    {
      id: prettyId(),
      name: '1-entry',
      next: [
        {
          condition: 'true',
          node: '2-call_from_previous_answer'
        }
      ],
      onEnter: <any>[
        {
          contentType: 'builtin_text',
          formData: {
            text$en: "Ask Question - What's your favorite ice cream Flavor ?",
            markdown$en: true,
            typing$en: true
          }
        }
      ],
      onReceive: ['builtin/setVariable {"type":"temp","name":"flavor","value":"{{event.payload.text}}"}']
    },
    {
      id: prettyId(),
      name: '3-show_output',
      next: [
        {
          condition: 'true',
          node: 'END'
        }
      ],
      onEnter: <any>[
        {
          contentType: 'builtin_text',
          formData: {
            text$en: 'This value was store in the **temp.flavor** {{temp.flavor}}',
            markdown$en: true,
            typing$en: true
          }
        }
      ],
      onReceive: null,
      type: 'standard'
    },
    {
      id: 'skill-d73632',
      type: 'skill-call',
      skill: 'CallAPI',
      name: '2-call_from_previous_answer',
      flow: `skills/${FLOW_API_NAME}`,
      next: [
        {
          caption: 'On success',
          condition: 'temp.valid_yqw4b030nu',
          node: '3-show_output'
        },
        {
          caption: 'On failure',
          condition: '!temp.valid_yqw4b030nu',
          node: '4-retry'
        }
      ],
      onEnter: null,
      onReceive: null
    },
    {
      id: 'skill-294337',
      type: 'skill-call',
      skill: 'choice',
      name: '4-retry',
      flow: `skills/${FLOW_CHOICE_NAME}`,
      next: [
        { caption: 'User picked [vanilla]', condition: 'temp[\'skill-choice-ret-ywsom8f1sn\'] == "vanilla"', node: '' },
        {
          caption: 'User picked [strawbe...]',
          condition: 'temp[\'skill-choice-ret-ywsom8f1sn\'] == "strawberry"',
          node: ''
        },
        {
          caption: 'On failure',
          condition: 'true',
          conditionType: 'always',
          node: 'END'
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
      skill: 'CallAPI',
      name: 'call_from_previous_answer',
      startNode: 'call_from_previous_answer',
      flow: `${FLOW_API_NAME}`,
      location: `skills/${FLOW_API_NAME}`,
      skillData: {
        method: 'post',
        memory: 'temp',
        // @ts-ignore
        body: '{"value": "{{temp.flavor}}"}',
        url: 'http://localhost:8080',
        variable: 'response',
        invalidJson: false
      }
    },
    {
      skill: 'choice',
      name: 'show_output_api',
      startNode: 'show_output_api',
      flow: `${FLOW_CHOICE_NAME}`,
      location: `skills/${FLOW_CHOICE_NAME}`,
      contentType: {
        contentType: 'builtin_single-choice',
        formData: {
          dropdownPlaceholder$en: 'Select...',
          choices$en: [
            {
              title: 'Vanilla',
              value: 'vanilla'
            },
            {
              title: 'Strawberry',
              value: 'strawberry'
            }
          ],
          markdown$en: true,
          disableFreeText$en: false,
          typing$en: true,
          text$en: 'Favorite ice cream'
        }
      },
      skillData: {
        invalidContentId: '',
        keywords: {
          yes: ['yes', 'Yes'],
          no: ['no', 'No']
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
