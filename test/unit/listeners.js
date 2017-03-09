/* eslint-env babel-eslint, node, mocha */

const _ = require('lodash')
const Promise = require('bluebird')
const listeners = require('../../lib/listeners')

describe('hear', function() {

  const { hear: hearFn } = listeners

  const hearYes = condition => event => {
    return Promise.fromCallback((callback) => {
      hearFn(condition, () => {
        callback()
      })(event)
    }).timeout(10)
  }

  const hearNo = condition => event => {
    return Promise.fromCallback((callback) => {
      hearFn(condition, () => { 
        throw new Error('Expected condition not to work')
      })(event)
      setTimeout(callback, 5)
    })
  }

  const event = {
    type: 'message',
    platform: 'facebook',
    text: 'Hello world',
    raw: {
      from: '1234567890',
      message: 'Hello world',
      user: {
        name: 'Garry',
        age: 25
      }
    }
  }

  it('condition is string', () => {
    return Promise.all([
      hearYes('Hello world')(event),
      hearNo('hello world')(event),
      hearNo('banana')(event),
    ])
  })

  it('condition is regex', () => {
    return Promise.all([
      hearYes(/world/)(event),
      hearNo(/World/)(event),
      hearYes(/World/i)(event),
    ])
  })

  it('condition is function', () => {
    return Promise.all([
      hearYes(t => t === 'Hello world')(event),
      hearNo(t => t === 'hello, world')(event)
    ])
  })

  it('Many conditions', () => {
    return Promise.all([
      hearYes({ text: /world/, type: 'message' })(event),
      hearNo({ text: /world/, platform: 'twitter' })(event),
      hearNo({ 'raw.user.age': 26 })(event),
    ])
  })

  it('Deep keys', () => {
    return Promise.all([
      hearYes({ 'raw.user.name': 'Garry' })(event),
      hearYes({ 'raw.user.age': 25 })(event),
      hearNo({ 'raw.user.age': 26 })(event),
    ])
  })

})
