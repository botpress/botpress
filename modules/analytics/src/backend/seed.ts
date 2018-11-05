import fs from 'fs'
import _ from 'lodash'
import moment from 'moment'
import nanoid from 'nanoid/generate'

import db from './db'

const dbFile = process.env.DB_PATH || './seed.sqlite'
const daysBack = 98
const initialNumberOfUsers = 1000
const interactionsPerDay = 1.5
const retentionRate = 0.94
const growthRate = 0.01
const fixedDailyGrowth = 250
const channels = ['facebook', 'slack']
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

const generateName = () => {
  return nanoid(_.random(5, 20, false))
}

const addUsers = (count, knex, date) => {
  count = parseInt(count)
  const rows = []

  for (let i = 0; i < count; i++) {
    const channel = _.sample(channels)
    const id = _.uniqueId()

    const first_name = { key: 'first_name', value: generateName(), type: 'string' }
    const last_name = { key: 'last_name', value: generateName(), type: 'string' }
    const gender = { key: 'gender', value: Math.random() < vary(0.65, 0.35) ? 'male' : 'female', type: 'string' }
    const locale = { key: 'locale', value: _.sample(['en_US', 'fr_CA', 'en_CA']), type: 'string' }
    const timezone = { key: 'timezone', value: _.random(-6, 12, false), type: 'string' }

    const user = {
      user_id: id,
      channel: channel,
      attributes: JSON.stringify([first_name, last_name, gender, locale, timezone]),
      created_at: date
    }

    users.push(user)
    rows.push(user)
  }

  return knex.batchInsert('srv_channel_users', rows, 20).then(() => console.log('Added', count, 'users'))
}

const run = async knex => {
  const interactions = []
  const startDate = moment(new Date())
    .subtract(daysBack, 'days')
    .toDate()
    .toISOString()

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
            .toDate()
            .toISOString()

          const direction = Math.random() > 0.3 ? 'in' : 'out'
          const user = _.sample(users)

          interactions.push({
            ts: time,
            type: 'text',
            text: 'Random',
            user_id: user.user_id,
            channel: user.channel,
            direction: direction
          })
          count++
        }

        dropUsers(vary((1 - retentionRate) * users.length, 0.13))
        const addDate = moment(new Date())
          .subtract(i, 'days')
          .toDate()
          .toISOString()

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

export default { run }
