import { DatabaseHelpers as helpers } from 'botpress'

import moment from 'moment'

let knex = null

function initialize() {
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  return helpers(knex)
    .createTableIfNotExists('broadcast_schedules', function(table) {
      table.increments('id').primary()
      table.string('date_time')
      table.timestamp('ts')
      table.string('text')
      table.string('type')
      table.boolean('outboxed')
      table.boolean('errored')
      table.integer('total_count')
      table.integer('sent_count')
      table.timestamp('created_on')
      table.string('filters')
    })
    .then(function() {
      return helpers(knex).createTableIfNotExists('broadcast_outbox', function(table) {
        table
          .integer('scheduleId')
          .references('broadcast_schedules.id')
          .onDelete('CASCADE')
        table.string('userId').references('users.id')
        table.primary(['scheduleId', 'userId'])
        table.timestamp('ts')
      })
    })
}

function addSchedule({ date, time, timezone, content, type, filters }) {
  const dateTime = date + ' ' + time
  let ts = null

  if (timezone) {
    ts = moment(new Date(dateTime + ' ' + timezone)).toDate()
  }

  const row = {
    date_time: dateTime,
    ts: ts ? helpers(knex).date.format(ts) : null,
    text: content,
    type: type,
    outboxed: false,
    errored: false,
    total_count: 0,
    sent_count: 0,
    created_on: helpers(knex).date.now(),
    filters: JSON.stringify(filters)
  }

  return knex('broadcast_schedules')
    .insert(row, 'id')
    .then()
    .get(0)
}

function updateSchedule({ id, date, time, timezone, content, type, filters }) {
  const dateTime = date + ' ' + time
  let ts = null
  if (timezone) {
    ts = moment(new Date(dateTime + ' ' + timezone)).toDate()
  }

  const row = {
    date_time: dateTime,
    ts: ts ? helpers(knex).date.format(ts) : null,
    text: content,
    type: type,
    filters: JSON.stringify(filters)
  }

  return knex('broadcast_schedules')
    .where({
      id: id,
      outboxed: helpers(knex).bool.false()
    })
    .update(row)
    .then()
}

function deleteSchedule(id) {
  return knex('broadcast_schedules')
    .where({ id: id })
    .delete()
    .then(() => {
      return knex('broadcast_outbox')
        .where({ scheduleId: id })
        .del()
        .then(() => true)
    })
}

function listSchedules() {
  return knex('broadcast_schedules').then()
}

module.exports = k => {
  knex = k
  return { initialize, addSchedule, deleteSchedule, updateSchedule, listSchedules }
}
