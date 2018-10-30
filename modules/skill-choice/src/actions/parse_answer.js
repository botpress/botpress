'use strict'
const _ = require('lodash')
const INTENT_PREFIX = 'intent:'

/**
 * Get a variable under this user's storage
 * @title Validate user choice
 * @category Skills
 * @author Botpress, Inc.
 * @param {string} data - The parameters of the available choices
 */
const validateChoice = async data => {
  let choice = undefined
  const config = await bp.config.getModuleConfigForBot('skill-choice', event.botId)
  const nb = _.get(event.preview.match(/^[#).!]?([\d]{1,2})[#).!]?$/), '[1]')

  if (config.matchNumbers && nb) {
    const index = parseInt(nb) - 1
    const element = await bp.cms.getContentElement(event.botId, data.contentId)
    choice = _.get(element, `formData.choices.${index}.value`)
  }

  if (!choice && config.matchNLU && typeof _.get(event.nlu, 'intent.is') === 'function') {
    choice = _.findKey(data.keywords, keywords => {
      const intents = keywords
        .filter(x => x.toLowerCase().startsWith(INTENT_PREFIX))
        .map(x => x.substr(INTENT_PREFIX.length))
      return _.some(intents, k => event.nlu.intent.is(k))
    })
  }

  if (!choice) {
    choice = _.findKey(data.keywords, keywords =>
      _.some(
        keywords || [],
        k =>
          _.includes(event.preview.toLowerCase(), k.toLowerCase()) ||
          (event.payload && _.includes(event.payload.text.toLowerCase(), k.toLowerCase()))
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
}

return validateChoice(args)
