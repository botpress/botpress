import axios from 'axios'
import crypto from 'crypto'
import { GoogleToken } from 'gtoken'
import Zip from 'jszip'
import _ from 'lodash'
import LRU from 'lru-cache'
import ms from 'ms'

import { Dataset, DialogflowConfig } from '../typings'
import { parseUtterance } from '../utterance-parser'

const tokenCache = new LRU({ max: 10000 })

const uuid = require('uuid/v1')

export const createZip = async (dataset: Dataset, config: DialogflowConfig): Promise<string> => {
  const zip = new Zip()
  zip.file('package.json', Files['package.json']())
  zip.file(
    'agent.json',
    Files['agent.json']({
      defaultLang: dataset.defaultLanguage,
      description: '',
      otherLangs: dataset.otherLanguages,
      projectId: config.projectId
    })
  )

  const entities = zip.folder('entities')
  dataset.entities
    .filter(x => x.type === 'list')
    .forEach(entity => {
      entities.file(
        `${entity.name}.json`,
        Files['entities/<name>.json']({ name: entity.name, isFuzzy: entity.fuzzy > 0, type: 'list' })
      )
      entities.file(
        `${entity.name}_entries_${dataset.defaultLanguage}.json`,
        Files['entities/<name>_entries_<lang>.json'](
          entity.occurrences.map(x => ({
            value: x.name,
            synonyms: x.synonyms
          }))
        )
      )
    })

  dataset.entities
    .filter(x => x.type === 'pattern')
    .forEach(entity => {
      entities.file(
        `${entity.name}.json`,
        Files['entities/<name>.json']({ name: entity.name, isFuzzy: false, type: 'pattern' })
      )
      entities.file(
        `${entity.name}_entries_${dataset.defaultLanguage}.json`,
        Files['entities/<name>_entries_<lang>.json']([
          {
            value: entity.pattern,
            synonyms: [entity.pattern]
          }
        ])
      )
    })

  const intents = zip.folder('intents')
  dataset.intents.forEach(intent => {
    intents.file(
      `${intent.name}.json`,
      Files['intents/<name>.json']({
        name: intent.name,
        contexts: intent.contexts,
        slots: intent.slots.map(x => ({
          name: x.name,
          type: findSlotType(x.name, intent.slots, config)
        }))
      })
    )

    const langs = Object.keys(intent.utterances).filter(lang => intent.utterances[lang].length)
    for (const lang of langs) {
      const content = Files['intents/<name>_usersays_<lang>.json'](intent.utterances[lang], intent.slots, config)
      intents.file(`${intent.name}_usersays_${lang}.json`, content)
    }
  })

  return zip.generateAsync({ type: 'base64' })
}

export const getToken = async (config: DialogflowConfig) => {
  const key = crypto
    .createHash('md5')
    .update(`${config.serviceAccountPrivateKey}|${config.projectId}|${config.serviceAccountEmail}`)
    .digest('hex')

  if (tokenCache.has(key)) {
    return tokenCache.get(key)
  }

  const gtoken = new GoogleToken({
    key: config.serviceAccountPrivateKey,
    scope: ['https://www.googleapis.com/auth/dialogflow'],
    email: config.serviceAccountEmail
  })
  const tokens = await gtoken.getToken()
  const token = tokens && tokens.access_token
  if (token) {
    tokenCache.set(key, token, ms('5m')) // TODO: Use token expiry received
    return token
  }

  throw new Error('Could not authenticate to Dialogflow')
}

export const restoreAgent = async (base64Zip: string, config: DialogflowConfig) => {
  const token = await getToken(config)
  const body = {
    agentContent: base64Zip
  }
  await axios.post(`https://content-dialogflow.googleapis.com/v2/projects/${config.projectId}/agent:restore`, body, {
    params: { alt: 'json' },
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export const predict = async (config: DialogflowConfig, text: string, langCode: string, contexts: string[]) => {
  const token = await getToken(config)
  const sessionId = uuid()
  const body = {
    queryParams: {
      contexts: contexts.filter(x => x.toLowerCase() !== 'global').map(x => ({ name: x, lifespanCount: 1 }))
    },
    queryInput: { text: { languageCode: langCode, text } }
  }

  const { data } = await axios.post(
    `https://content-dialogflow.googleapis.com/v2/projects/${config.projectId}/agent/sessions/${sessionId}:detectIntent`,
    body,
    {
      params: { alt: 'json' },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return {
    slots: _.get(data, 'queryResult.parameters', {}),
    intent: _.get(data, 'queryResult.intent.displayName', 'none'),
    confidence: _.get(data, 'queryResult.intentDetectionConfidence', 1)
  }
}

const testCredentials = async () => {
  // test prediction (client role)
  // test reading agent description (read admin role)
  // test update agent description (write admin role)
}

const toJson = obj =>
  JSON.stringify(obj, undefined, 2).replace(/[\u007F-\uFFFF]/g, function(chr) {
    return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4)
  })

const findSlotType = (slotName: string, slots: object[], config: DialogflowConfig) => {
  const slot = slots.find(slot => slot['name'] === slotName)

  if (slot === undefined) {
    return '@sys.any'
  }

  if (slot['entities'][0] === undefined) {
    return '@sys.any'
  }

  if (config.systemEntities[slot['entities'][0]] === undefined) {
    return '@' + slot['entities'][0]
  }

  return config.systemEntities[slot['entities'][0]]
}

const Files = {
  'package.json': () =>
    toJson({
      version: '1.0.0'
    }),

  'agent.json': (options: { defaultLang: string; otherLangs: string[]; projectId: string; description: string }) =>
    toJson({
      description: options.description,
      language: options.defaultLang,
      shortDescription: '',
      examples: '',
      linkToDocs: '',
      activeAssistantAgents: [],
      disableInteractionLogs: false,
      disableStackdriverLogs: true,
      googleAssistant: {
        googleAssistantCompatible: false,
        project: options.projectId,
        welcomeIntentSignInRequired: false,
        startIntents: [],
        systemIntents: [],
        endIntentIds: [],
        oAuthLinking: {
          required: false,
          providerId: '',
          authorizationUrl: '',
          tokenUrl: '',
          scopes: '',
          privacyPolicyUrl: '',
          grantType: 'AUTH_CODE_GRANT'
        },
        voiceType: 'MALE_1',
        capabilities: [],
        env: '',
        protocolVersion: 'V2',
        autoPreviewEnabled: false,
        isDeviceAgent: false
      },
      defaultTimezone: 'America/New_York',
      webhook: {
        url: '',
        username: '',
        headers: {
          '': ''
        },
        available: false,
        useForDomains: false,
        cloudFunctionsEnabled: false,
        cloudFunctionsInitialized: false
      },
      isPrivate: true,
      customClassifierMode: 'use.after',
      mlMinConfidence: 0.3,
      supportedLanguages: options.otherLangs,
      onePlatformApiVersion: 'v2',
      analyzeQueryTextSentiment: false,
      enabledKnowledgeBaseNames: [],
      knowledgeServiceConfidenceAdjustment: -0.4,
      dialogBuilderMode: false,
      baseActionPackagesUrl: ''
    }),

  'entities/<name>.json': (options: { name: string; type: 'list' | 'pattern'; isFuzzy: boolean }) =>
    toJson({
      id: uuid(),
      name: options.name,
      isOverridable: true,
      isEnum: false,
      isRegexp: options.type === 'pattern',
      automatedExpansion: false,
      allowFuzzyExtraction: options.isFuzzy
    }),

  'entities/<name>_entries_<lang>.json': (entries: { value: string; synonyms: string[] }[]) =>
    toJson(
      entries.map(entry => ({
        value: entry.value,
        synonyms: entry.synonyms
      }))
    ),

  'intents/<name>.json': (options: { name: string; contexts: string[]; slots: { type: string; name: string }[] }) =>
    toJson({
      id: uuid(),
      name: options.name,
      auto: true,
      contexts: options.contexts.filter(x => x.toLowerCase() !== 'global'),
      responses: [
        {
          resetContexts: false,
          affectedContexts: [],
          parameters: options.slots.map(slot => ({
            id: uuid(),
            required: false,
            dataType: slot.type,
            name: slot.name,
            value: '$' + slot.name,
            defaultValue: '',
            promptMessages: [],
            noMatchPromptMessages: [],
            noInputPromptMessages: [],
            outputDialogContexts: [],
            isList: false
          })),
          messages: [
            {
              type: 0,
              lang: 'en',
              condition: '',
              speech: []
            }
          ],
          defaultResponsePlatforms: {},
          speech: []
        }
      ],
      priority: 500000,
      webhookUsed: false,
      webhookForSlotFilling: false,
      fallbackIntent: false,
      events: [],
      conditionalResponses: [],
      condition: '',
      conditionalFollowupEvents: []
    }),

  'intents/<name>_usersays_<lang>.json': (utterances: string[], slots: object[], config: DialogflowConfig) =>
    toJson(
      utterances
        .map(x => parseUtterance(x).parts)
        .map(parts => ({
          id: uuid(),
          data: parts.map(part => ({
            text: part.text,
            userDefined: !!part.slot,
            ...(part.slot
              ? {
                  alias: part.slot.name,
                  meta: findSlotType(part.slot.name, slots, config)
                }
              : {})
          })),
          isTemplate: false,
          count: 0,
          updated: 0
        }))
    )
}
