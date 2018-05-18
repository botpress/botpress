/* eslint-env babel-eslint, node, mocha */

const { itBoth, run } = require('./database_base')
const helpers = require('../src/database/helpers')
const expect = require('chai').expect
const moment = require('moment')
const { randomTableName } = require('./_util')

run('helpers', () => {
  describe('createTableIfNotExists', () => {
    itBoth('Creates if not exists', knex => {
      const randomName = randomTableName('tmp_rnd_')

      return helpers(knex)
        .createTableIfNotExists(randomName, table => {
          table.increments('id')
        })
        .then(() => knex.schema.hasTable(randomName))
        .then(has => expect(has).to.equal(true))
    })

    itBoth("Doesn't throw if already exists", knex => {
      const randomName = randomTableName('tmp_rnd_')

      return helpers(knex)
        .createTableIfNotExists(randomName, table => {
          table.increments('id')
        })
        .then(() => knex.schema.hasTable(randomName))
        .then(has => expect(has).to.equal(true))
        .then(() =>
          helpers(knex).createTableIfNotExists(randomName, table => {
            table.increments('id')
          })
        )
    })
  })

  describe('date', () => {
    itBoth('now works', (knex, sampleTable) => {
      knex(sampleTable)
        .insert({ tTimestamp: helpers(knex).date.now() })
        .then(() => knex(sampleTable).select('*'))
        .then(rows => {
          const delta = moment().diff(moment(rows[0].tTimestamp), 'milliseconds')
          expect(delta).to.be.below(250)
        })
    })

    itBoth('format works', (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )

      knex(sampleTable)
        .insert({ tTimestamp: now })
        .then(() => knex(sampleTable).insert({ tTimestamp: later }))
        .then(() => knex(sampleTable).select('*'))
        .then(rows => {
          const delta = moment(rows[1].tTimestamp).diff(moment(rows[0].tTimestamp), 'hours')
          expect(delta).to.be.within(23, 24)
        })
    })

    itBoth('isBefore works (col < exp)', (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )
      const between = helpers(knex).date.format(
        moment()
          .add(1, 'hour')
          .toDate()
      )

      knex(sampleTable)
        .insert({ tTimestamp: now })
        .then(() => knex(sampleTable).insert({ tTimestamp: later }))
        .then(() =>
          knex(sampleTable)
            .whereRaw(helpers(knex).date.isBefore('tTimestamp', between))
            .select('*')
        )
        .then(rows => {
          expect(rows.length).to.equal(1)
          expect(rows[0].tId).to.equal(1)
        })
    })

    itBoth('isBefore works (col < date)', (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )
      const between = moment()
        .add(1, 'hour')
        .toDate()

      knex(sampleTable)
        .insert({ tTimestamp: now })
        .then(() => knex(sampleTable).insert({ tTimestamp: later }))
        .then(() =>
          knex(sampleTable)
            .whereRaw(helpers(knex).date.isBefore('tTimestamp', between))
            .select('*')
        )
        .then(rows => {
          expect(rows.length).to.equal(1)
          expect(rows[0].tId).to.equal(1)
        })
    })

    itBoth('isAfter works (col < date)', (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )
      const between = moment()
        .add(1, 'hour')
        .toDate()

      knex(sampleTable)
        .insert({ tTimestamp: now })
        .then(() => knex(sampleTable).insert({ tTimestamp: later }))
        .then(() =>
          knex(sampleTable)
            .whereRaw(helpers(knex).date.isAfter('tTimestamp', between))
            .select('*')
        )
        .then(rows => {
          expect(rows.length).to.equal(1)
          expect(rows[0].tId).to.equal(2)
        })
    })

    itBoth('isBetween works', (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )

      knex(sampleTable)
        .insert({ tTimestamp: now })
        .then(() => knex(sampleTable).insert({ tTimestamp: later }))
        .then(() =>
          knex(sampleTable)
            .whereRaw(helpers(knex).date.isBetween('tTimestamp', now, later))
            .select('*')
        )
        .then(rows => {
          expect(rows.length).to.equal(1)
          expect(rows[0].tId).to.equal(2)
        })
    })

    itBoth('isSameDay works', (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const laterToday = helpers(knex).date.format(
        moment()
          .add(1, 'minutes')
          .toDate()
      )
      const tomorrow = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )

      return knex(sampleTable)
        .insert({ tTimestamp: now })
        .then(() => knex(sampleTable).insert({ tTimestamp: laterToday }))
        .then(() => knex(sampleTable).insert({ tTimestamp: tomorrow }))
        .then(() =>
          knex(sampleTable)
            .whereRaw(helpers(knex).date.isSameDay('tTimestamp', now))
            .select('*')
        )
        .then(rows => {
          return expect(rows.length).to.equal(2)
        })
    })
  })
})
