import _ from 'lodash'

let knex = undefined
let bp = undefined

export type SDK = typeof import('botpress/sdk')

export const initializeDb = (bp: SDK) => {
  this.bp = bp
  this.knex = bp['database'] // TODO Fixme
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  return this.knex
    .createTableIfNotExists('analytics_interactions', table => {
      table.increments('id').primary()
      table.timestamp('ts')
      table.string('type')
      table.string('text')
      table.string('user').references('users.id')
      table.enu('direction', ['in', 'out'])
    })
    .then(() => {
      return this.knex.knex.createTableIfNotExists('analytics_runs', table => {
        table.increments('id').primary()
        table.timestamp('ts')
      })
    })
    .then(() => {
      return this.knex.knex.createTableIfNotExists('analytics_custom', table => {
        table.string('date')
        table.string('name')
        table.integer('count')
        table.unique(['date', 'name'])
      })
    })
    .then(() => knex)
}

export const saveInteractionIn = event => {
  let user = _.get(event, 'user.id') || _.get(event, 'user.userId') || _.get(event, 'raw.from') || _.get(event, 'user')

  if (!user.startsWith(event.platform)) {
    user = event.platform + ':' + user
  }

  const interactionRow = {
    ts: this.knex.knex.date.now(),
    type: event.type,
    text: event.text,
    user: user,
    direction: 'in'
  }

  return this.knex('analytics_interactions').insert(interactionRow)
}

export const saveInteractionOut = event => {
  let userId = _.get(event, 'user.id') || _.get(event, 'user.userId') || _.get(event, 'raw.to') || _.get(event, 'user')

  if (!userId.startsWith(event.platform)) {
    userId = event.platform + ':' + userId
  }

  const interactionRow = {
    ts: this.knex.date.now(),
    type: event.type,
    text: event.text,
    user: userId,
    direction: 'out'
  }

  return this.knex('analytics_interactions')
    .insert(interactionRow)
    .then(function(result) {
      return true
    })
}

export default (k, botpress) => {
  knex = k
  bp = botpress

  return {
    initializeDb: initializeDb,
    saveIncoming: saveInteractionIn,
    saveOutgoing: saveInteractionOut
  }
}
