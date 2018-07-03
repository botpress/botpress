import Promise from 'bluebird'
import moment from 'moment'
import { DatabaseHelpers as helpers } from 'botpress'
import _ from 'lodash'

let knex = null
let bp = null

function initializeDb() {
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  return helpers(knex)
    .createTableIfNotExists('analytics_interactions', function(table) {
      table.increments('id').primary()
      table.timestamp('ts')
      table.string('type')
      table.string('text')
      table.string('user').references('users.id')
      table.enu('direction', ['in', 'out'])
    })
    .then(function() {
      return helpers(knex).createTableIfNotExists('analytics_runs', function(table) {
        table.increments('id').primary()
        table.timestamp('ts')
      })
    })
    .then(function() {
      return helpers(knex).createTableIfNotExists('analytics_custom', function(table) {
        table.string('date')
        table.string('name')
        table.integer('count')
        table.unique(['date', 'name'])
      })
    })
    .then(() => knex)
}

function saveInteractionIn(event) {
  let user = _.get(event, 'user.id') || _.get(event, 'user.userId') || _.get(event, 'raw.from') || _.get(event, 'user')

  if (!user.startsWith(event.platform)) {
    user = event.platform + ':' + user
  }

  const interactionRow = {
    ts: helpers(knex).date.now,
    type: event.type,
    text: event.text,
    user: user,
    direction: 'in'
  }

  return knex('analytics_interactions').insert(interactionRow)
}

function saveInteractionOut(event) {
  let userId = _.get(event, 'user.id') || _.get(event, 'user.userId') || _.get(event, 'raw.to') || _.get(event, 'user')

  if (!userId.startsWith(event.platform)) {
    userId = event.platform + ':' + userId
  }

  const interactionRow = {
    ts: helpers(knex).date.now,
    type: event.type,
    text: event.text,
    user: userId,
    direction: 'out'
  }

  return knex('analytics_interactions')
    .insert(interactionRow)
    .then(function(result) {
      return true
    })
}

module.exports = (k, botpress) => {
  knex = k
  bp = botpress

  return {
    initializeDb: initializeDb,
    saveIncoming: saveInteractionIn,
    saveOutgoing: saveInteractionOut
  }
}
