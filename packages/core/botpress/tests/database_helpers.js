/* eslint-env babel-eslint, node, mocha */

const { itBoth, run } = require('./database_base')
const helpers = require('../src/database/helpers')
const { expect } = require('chai')
const moment = require('moment')
const _ = require('lodash')
const Promise = require('bluebird')
const { randomTableName } = require('./_util')

run('helpers', () => {
  describe('createTableIfNotExists', () => {
    itBoth('Creates if not exists', async knex => {
      const randomName = randomTableName('tmp_rnd_')

      await helpers(knex).createTableIfNotExists(randomName, table => {
        table.increments('id')
      })

      expect(await knex.schema.hasTable(randomName)).to.equal(true)
    })

    itBoth("Doesn't throw if already exists", async knex => {
      const randomName = randomTableName('tmp_rnd_')

      await helpers(knex).createTableIfNotExists(randomName, table => {
        table.increments('id')
      })

      expect(await knex.schema.hasTable(randomName)).to.equal(true)

      await helpers(knex).createTableIfNotExists(randomName, table => {
        table.increments('id')
      })
    })
  })

  describe('insertAndRetrieve', function() {
    this.timeout(5000)
    itBoth('returns inserted data', (knex, sampleTable) => {
      return Promise.map(_.range(500), async index => {
        const tString =
          index +
          ':' +
          Math.random()
            .toString()
            .substr(2)

        const inserted = await helpers(knex)
          .insertAndRetrieve(sampleTable, { tString }, ['tId', 'tString'], 'tId')

        expect(inserted).to.not.equal(null)
        expect(inserted.tString).to.equal(tString)
        expect(typeof inserted.tId).to.equal('number')
      })
    })
  })

  describe('date', () => {
    itBoth('now works', async (knex, sampleTable) => {
      await knex(sampleTable).insert({ tTimestamp: helpers(knex).date.now() })
      const rows = await knex(sampleTable).select('*');
      const delta = moment().diff(moment(rows[0].tTimestamp), 'milliseconds')
      expect(delta).to.be.below(250)
    })

    itBoth('format works', async (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )

      await knex(sampleTable).insert({ tTimestamp: now })
      await knex(sampleTable).insert({ tTimestamp: later })
      const rows = await knex(sampleTable).select('*')
      const delta = moment(rows[1].tTimestamp).diff(moment(rows[0].tTimestamp), 'hours')
      expect(delta).to.be.within(23, 24)
    })

    itBoth('isBefore works (col < exp)', async (knex, sampleTable) => {
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

      await knex(sampleTable).insert({ tTimestamp: now })
      await knex(sampleTable).insert({ tTimestamp: later })

      const rows = await knex(sampleTable)
        .whereRaw(helpers(knex).date.isBefore('tTimestamp', between))
        .select('*')

      expect(rows.length).to.equal(1)
      expect(rows[0].tId).to.equal(1)
    })

    itBoth('isBefore works (col < date)', async (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )
      const between = moment()
        .add(1, 'hour')
        .toDate()

      await knex(sampleTable).insert({ tTimestamp: now })
      await knex(sampleTable).insert({ tTimestamp: later })

      const rows = await knex(sampleTable)
        .whereRaw(helpers(knex).date.isBefore('tTimestamp', between))
        .select('*')

      expect(rows.length).to.equal(1)
      expect(rows[0].tId).to.equal(1)
    })

    itBoth('isAfter works (col < date)', async (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )
      const between = moment()
        .add(1, 'hour')
        .toDate()

      await knex(sampleTable).insert({ tTimestamp: now })
      await knex(sampleTable).insert({ tTimestamp: later })

      const rows = await knex(sampleTable)
        .whereRaw(helpers(knex).date.isAfter('tTimestamp', between))
        .select('*')

      expect(rows.length).to.equal(1)
      expect(rows[0].tId).to.equal(2)
    })

    itBoth('isBetween works', async (knex, sampleTable) => {
      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(
        moment()
          .add(1, 'days')
          .toDate()
      )

      await knex(sampleTable).insert({ tTimestamp: now })
      await knex(sampleTable).insert({ tTimestamp: later })

      const rows = await knex(sampleTable)
        .whereRaw(helpers(knex).date.isBetween('tTimestamp', now, later))
        .select('*')

      expect(rows.length).to.equal(1)
      expect(rows[0].tId).to.equal(2)
    })

    itBoth('isSameDay works', async (knex, sampleTable) => {
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

      await knex(sampleTable).insert({ tTimestamp: now })
      await knex(sampleTable).insert({ tTimestamp: laterToday })
      await knex(sampleTable).insert({ tTimestamp: tomorrow })

      const rows = await knex(sampleTable)
        .whereRaw(helpers(knex).date.isSameDay('tTimestamp', now))
        .select('*')

      expect(rows.length).to.equal(2)
    })
  })
})
