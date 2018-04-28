const _ = require('lodash')
const moment = require('moment')
const db = require('./db')
const Promise = require('bluebird')
const fs = require('fs')

const dbFile = process.env.DB_PATH || './seed.sqlite'
const daysBack = 98
const initialNumberOfUsers = 1000
const interactionsPerDay = 1.5
const retentionRate = 0.94
const growthRate = 0.01
const fixedDailyGrowth = 250
const platforms = ['facebook', 'slack']
const distribution = {
  0: 5,
  1: 5,
  2: 5,
  3: 7,
  4: 10,
  5: 10,
  6: 20,
  7: 30,
  8: 70,
  9: 65,
  10: 20,
  11: 30,
  12: 35,
  13: 23,
  14: 20,
  15: 35,
  16: 65,
  17: 70,
  18: 75,
  19: 30,
  20: 25,
  21: 20,
  22: 9,
  23: 8
}

const users = []

const vary = (nb, variance = 0.1) => {
  return nb + _.random(-variance * nb, variance * nb, false)
}

const dropUsers = count => {
  count = parseInt(count)
  const removeAt = _.uniq(_.times(count, () => _.random(0, users.length)))
  _.pullAt(users, removeAt)
  console.log('Removed ~', count, 'users')
}

const addUsers = (count, knex, date) => {
  count = parseInt(count)
  const rows = []
  for (let i = 0; i < count; i++) {
    const platform = _.sample(platforms)
    const gender = Math.random() < vary(0.65, 0.35) ? 'male' : 'female'
    const id = _.uniqueId()
    const locale = _.sample(['en_US', 'fr_CA', 'en_CA'])

    const user = {
      id: platform + ':' + id,
      userId: id,
      platform: platform,
      gender: gender,
      timezone: _.random(-6, 12, false),
      locale: locale,
      created_on: date
    }

    users.push(user)
    rows.push(user)
  }

  return knex.batchInsert('users', rows, 20).then(() => console.log('Added', count, 'users'))
}

const run = knex => {
  const interactions = []
  const startDate = moment(new Date())
    .subtract(daysBack, 'days')
    .format('x')
  return addUsers(initialNumberOfUsers, knex, startDate)
    .then(() => {
      return Promise.mapSeries(_.times(daysBack, n => n + 1), day => {
        const i = daysBack - day
        console.log('day', i)
        let count = 0
        const target = vary(interactionsPerDay * users.length)
        while (count < target) {
          const hour = _.random(1, 24, false)
          if (Math.random() > distribution[hour] / 100) {
            continue
          }
          const time = moment(new Date())
            .startOf('day')
            .subtract(i, 'days')
            .add(hour - 1, 'hours')
          const direction = Math.random() > 0.3 ? 'in' : 'out'
          const user = _.sample(users)
          interactions.push({
            ts: time.format('x'),
            type: 'text',
            text: 'Random',
            user: user.id,
            direction: direction
          })
          count++
        }
        dropUsers(vary((1 - retentionRate) * users.length), 0.13)
        const addDate = moment(new Date())
          .subtract(i, 'days')
          .format('x')
        const nbNewUsers = vary(users.length * growthRate, 0.25) + vary(fixedDailyGrowth, 0.25)
        return addUsers(nbNewUsers, knex, addDate)
      })
    })
    .then(() => {
      console.log('Preparing to insert', interactions.length)
      return knex
        .batchInsert('analytics_interactions', interactions, 20)
        .then(() => console.log('Added', interactions.length, 'interactions'))
    })
    .then(() => console.log('ALL DONE'))
}

if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile)
}

db
  .getOrCreate(dbFile) // TODO Fix that
  .then(knex => {
    return run(knex)
  })
  .then(() => process.exit(0))
