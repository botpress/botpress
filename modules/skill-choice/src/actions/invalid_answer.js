'use strict'
const _ = require('lodash')

const invalidAnswer = async () => {
  const key = 'skill-choice-invalid-count'
  return { ...state, [key]: (state[key] || 0) + 1 }
}

return invalidAnswer()
