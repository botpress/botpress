'use strict'
const _ = require('lodash')

const invalidAnswer = async () => {
  const key = 'skill-choice-invalid-count'
  const value = (state[key] || 0) + 1
  return { ...state, [key]: value }
}

return invalidAnswer()
