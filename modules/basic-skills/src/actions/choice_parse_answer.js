'use strict'
const _ = require('lodash')
const INTENT_PREFIX = 'intent:'

/**
 * Get a variable under this user's storage
 * @title Validate user choice
 * @category Skills
 * @hidden true
 * @author Botpress, Inc.
 * @param {string} data - The parameters of the available choices
 */
const validateChoice = async data => {
  let choice = undefined
  const config = await bp.config.getModuleConfigForBot('basic-skills', event.botId)
  const nb = _.get(event.preview && event.preview.match(/^[#).!]?([\d]{1,2})[#).!]?$/), '[1]')

  if (config.matchNumbers && nb) {
    const index = parseInt(nb) - 1
    const element = await bp.cms.getContentElement(event.botId, data.contentId)
    choice = _.get(element, `formData.choices.${index}.value`)
  }

  if (!choice && config.matchNLU) {
    choice = _.findKey(data.keywords, keywords => {
      const intents = keywords
        .filter(x => (x || '').toLowerCase().startsWith(INTENT_PREFIX))
        .map(x => x.substr(INTENT_PREFIX.length))
      return _.some(intents, k => event.nlu.intent.name === k)
    })
  }

  if (!choice) {
    const lcstr = value => (typeof value === 'string' ? value.toLowerCase() : '')
    const preview = lcstr(event.preview)
    const userText = lcstr(event.payload && event.payload.text)
    const choiceValue = lcstr(event.payload && event.payload.payload)
    choice = _.findKey(data.keywords, keywords =>
      _.some(keywords || [], k => {
        const keyword = lcstr(k)
        return preview === keyword || userText === keyword || choiceValue === keyword
      })
    )
    if (!choice) {
      choice = _.findKey(data.keywords, keywords =>
        _.some(keywords || [], k => {
          const keyword = lcstr(k)
          return preview.includes(keyword) || userText.includes(keyword) || choiceValue.includes(keyword)
        })
      )
    }
  }

  const keySuffix = args.randomId ? `-${args.randomId}` : ''
  if (choice) {
    temp[`skill-choice-valid${keySuffix}`] = true
    temp[`skill-choice-ret${keySuffix}`] = choice
  } else {
    temp[`skill-choice-valid${keySuffix}`] = false
  }
}

return validateChoice(args)
