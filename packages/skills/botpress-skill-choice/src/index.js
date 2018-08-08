import _ from 'lodash'
import { Skill } from '@botpress/util-sdk'

let botpress = null
let config = null
const INTENT_PREFIX = 'intent:'

const checkCategoryAvailable = async () => {
  const categories = await botpress.contentManager.listAvailableCategories().map(c => c.id)

  if (!categories.includes(config.defaultContentElement)) {
    botpress.logger.warn(
      `[Skill/Choice] Configured to use Content Element "${config.defaultContentElement}", but it was not found.`
    )

    if (config.defaultContentElement === 'builtin_single-choice') {
      botpress.logger.warn(`[Skill/Choice] You should probably install (and use) the @botpress/builtins 
module OR change the "defaultContentElement" in this module's configuration to use your own content element.`)
    }

    return
  }
}

module.exports = {
  config: {
    defaultContentElement: {
      type: 'string',
      required: true,
      default: 'builtin_single-choice',
      env: 'SKILL_CHOICE_CONTENT_ELEMENT'
    },
    defaultContentRenderer: {
      type: 'string',
      required: true,
      default: '#builtin_single-choice',
      env: 'SKILL_CHOICE_CONTENT_RENDERER'
    },
    defaultMaxAttempts: { type: 'string', required: false, default: '3', env: 'SKILL_CHOICE_MAX_ATTEMPTS' },
    matchNumbers: { type: 'bool', required: false, default: true, env: 'SKILL_CHOICE_MATCH_NUMBERS' },
    disableIntegrityCheck: { type: 'bool', required: false, default: false, env: 'SKILL_DISABLE_INTEGRITY_CHECK' },
    matchNLU: { type: 'bool', required: false, default: true, env: 'SKILL_CHOICE_MATCH_NLU' }
  },

  init: async function(bp, configurator) {
    botpress = bp
    config = await configurator.loadAll()
  },

  ready: async function(bp, configurator) {
    if (!config.disableIntegrityCheck) {
      setTimeout(checkCategoryAvailable, 3000)
    }

    const router = bp.getRouter('botpress-skill-choice')

    router.get('/config', (req, res) => {
      res.send(
        _.pick(config, ['defaultContentElement', 'defaultContentRenderer', 'defaultMaxAttempts', 'matchNumbers'])
      )
    })

    bp.dialogEngine.registerActions({
      '__skill-choice-parse': async function(state, { text, payload, nlu }, data) {
        let choice = null

        const nb = _.get(text.match(/^[#).!]?([\d]{1,2})[#).!]?$/), '[1]')
        if (config.matchNumbers && nb) {
          const index = parseInt(nb) - 1
          const element = await botpress.contentManager.getItem(data.contentId)
          choice = _.get(element, `data.choices.${index}.value`)
        }

        if (!choice && config.matchNLU && typeof _.get(nlu, 'intent.is') === 'function') {
          choice = _.findKey(data.keywords, keywords => {
            const intents = keywords
              .filter(x => x.toLowerCase().startsWith(INTENT_PREFIX))
              .map(x => x.substr(INTENT_PREFIX.length))
            return _.some(intents, k => nlu.intent.is(k))
          })
        }

        if (!choice) {
          choice = _.findKey(data.keywords, keywords =>
            _.some(
              keywords || [],
              k =>
                _.includes(text.toLowerCase(), k.toLowerCase()) ||
                (payload && _.includes(payload.toLowerCase(), k.toLowerCase()))
            )
          )
        }

        if (choice) {
          return {
            ...state,
            'skill-choice-valid': true,
            'skill-choice-ret': choice
          }
        } else {
          return { ...state, 'skill-choice-valid': false }
        }
      },

      '__skill-choice-invalid-inc': function(state) {
        const key = 'skill-choice-invalid-count'
        return { ...state, [key]: (state[key] || 0) + 1 }
      }
    })
  },

  generate: async function(data) {
    const invalidTextData = {}
    if (data.config.invalidText && data.config.invalidText.length) {
      invalidTextData.text = data.config.invalidText
    }

    const maxAttempts = data.config.nbMaxRetries || config.defaultMaxAttempts

    const flow = Skill.Flow({
      nodes: [
        Skill.Node({
          name: 'entry',
          onEnter: [Skill.renderElement('#!' + data.contentId, { skill: 'choice' })],
          next: [{ condition: 'true', node: 'parse' }]
        }),
        Skill.Node({
          name: 'parse',
          onReceive: [Skill.runAction('__skill-choice-parse', data)],
          next: [
            { condition: "state['skill-choice-valid'] === true", node: '#' },
            { condition: 'true', node: 'invalid' }
          ]
        }),
        Skill.Node({
          name: 'invalid',
          onEnter: [Skill.runAction('__skill-choice-invalid-inc')],
          next: [
            { condition: `state['skill-choice-invalid-count'] <= ${maxAttempts}`, node: 'sorry' },
            { condition: 'true', node: '#' }
          ]
        }),
        Skill.Node({
          name: 'sorry',
          onEnter: [Skill.renderElement('#!' + data.contentId, { ...invalidTextData, skill: 'choice' })], // TODO Make property configurable
          next: [{ condition: 'true', node: 'parse' }]
        })
      ]
    })

    const transitions = Object.keys(data.keywords).map(choice => {
      const choiceShort = choice.length > 8 ? choice.substr(0, 7) + '...' : choice

      return {
        caption: `User picked [${choiceShort}]`,
        condition: `state['skill-choice-ret'] == "${choice}"`,
        node: ''
      }
    })

    transitions.push({
      caption: 'On failure',
      condition: 'true',
      node: ''
    })

    return { transitions, flow }
  }
}
