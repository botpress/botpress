/* eslint-env babel-eslint, node, mocha */

const {itBoth, run} = require('./database_base')
const helpers = require('../../lib/database_helpers')
const expect = require('chai').expect
const moment = require('moment')

run('helpers', function() {

  describe('createTableIfNotExists', function() {

    itBoth('Creates if not exists', function(knex) {
      const randomName = 'tmp_rnd_' + Math.random().toString().substr(2)

      return helpers(knex).createTableIfNotExists(randomName, function(table) {
        table.increments('id')
      })
      .then(() => knex.schema.hasTable(randomName))
      .then(has => expect(has).to.equal(true))
    })

    itBoth('Doesn\'t throw if already exists', function(knex) {
      const randomName = 'tmp_rnd_' + Math.random().toString().substr(2)

      return helpers(knex).createTableIfNotExists(randomName, function(table) {
        table.increments('id')
      })
      .then(() => knex.schema.hasTable(randomName))
      .then(has => expect(has).to.equal(true))
      .then(() => {
        return helpers(knex).createTableIfNotExists(randomName, function(table) {
          table.increments('id')
        })
      })
    })

  })

  describe('date', function() {

    itBoth('now works', function(knex, sampleTable) {
      knex(sampleTable).insert({ tTimestamp: helpers(knex).date.now() })
      .then(() => knex(sampleTable).select('*'))
      .then(rows => {
        const delta = moment().diff(moment(rows[0].tTimestamp), 'milliseconds')
        expect(delta).to.be.below(250)
      })
    })

    itBoth('format works', function(knex, sampleTable) {

      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(moment().add(1, 'days').toDate())

      knex(sampleTable).insert({ tTimestamp: now })
      .then(() => knex(sampleTable).insert({ tTimestamp: later }))
      .then(() => knex(sampleTable).select('*'))
      .then(rows => {
        const delta = moment(rows[1].tTimestamp).diff(moment(rows[0].tTimestamp), 'hours')
        expect(delta).to.be.within(23, 24)
      })
    })

    itBoth('isBefore works (col < exp)', function(knex, sampleTable) {

      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(moment().add(1, 'days').toDate())
      const between = helpers(knex).date.format(moment().add(1, 'hour').toDate())

      knex(sampleTable).insert({ tTimestamp: now })
      .then(() => knex(sampleTable).insert({ tTimestamp: later }))
      .then(() => {
        return knex(sampleTable)
        .whereRaw(helpers(knex).date.isBefore('tTimestamp', between))
        .select('*')
      })
      .then(rows => {
        expect(rows.length).to.equal(1)
        expect(rows[0].tId).to.equal(1)
      })
    })

    itBoth('isBefore works (col < date)', function(knex, sampleTable) {

      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(moment().add(1, 'days').toDate())
      const between = moment().add(1, 'hour').toDate()

      knex(sampleTable).insert({ tTimestamp: now })
      .then(() => knex(sampleTable).insert({ tTimestamp: later }))
      .then(() => {
        return knex(sampleTable)
        .whereRaw(helpers(knex).date.isBefore('tTimestamp', between))
        .select('*')
      })
      .then(rows => {
        expect(rows.length).to.equal(1)
        expect(rows[0].tId).to.equal(1)
      })
    })

    itBoth('isAfter works (col < date)', function(knex, sampleTable) {

      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(moment().add(1, 'days').toDate())
      const between = moment().add(1, 'hour').toDate()

      knex(sampleTable).insert({ tTimestamp: now })
      .then(() => knex(sampleTable).insert({ tTimestamp: later }))
      .then(() => {
        return knex(sampleTable)
        .whereRaw(helpers(knex).date.isAfter('tTimestamp', between))
        .select('*')
      })
      .then(rows => {
        expect(rows.length).to.equal(1)
        expect(rows[0].tId).to.equal(2)
      })
    })

    itBoth('isBetween works', function(knex, sampleTable) {

      const now = helpers(knex).date.now()
      const later = helpers(knex).date.format(moment().add(1, 'days').toDate())

      knex(sampleTable).insert({ tTimestamp: now })
      .then(() => knex(sampleTable).insert({ tTimestamp: later }))
      .then(() => {
        return knex(sampleTable)
        .whereRaw(helpers(knex).date.isBetween('tTimestamp', now, later))
        .select('*')
      })
      .then(rows => {
        expect(rows.length).to.equal(1)
        expect(rows[0].tId).to.equal(2)
      })
    })


    itBoth('isSameDay works', function(knex, sampleTable) {

      const now = helpers(knex).date.now()
      const laterToday = helpers(knex).date.format(moment().add(1, 'hours').toDate())
      const tomorrow = helpers(knex).date.format(moment().add(1, 'days').toDate())

      knex(sampleTable).insert({ tTimestamp: now })
      .then(() => knex(sampleTable).insert({ tTimestamp: laterToday }))
      .then(() => knex(sampleTable).insert({ tTimestamp: tomorrow }))
      .then(() => {
        return knex(sampleTable)
        .whereRaw(helpers(knex).date.isSameDay('tTimestamp', now))
        .select('*')
      })
      .then(rows => {
        expect(rows.length).to.equal(2)
      })
    })

  })

})