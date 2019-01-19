import _ from 'lodash'
import { DatabaseHelpers as helpers } from 'botpress'

const Validate = require('validate-arguments')

import util from './util.js'

module.exports = bp => {
  return {
    bootstrap: () => {
      return bp.db.get().then(initialize)
    },
    create: async (id, options) => create(await bp.db.get(), id, options),
    update: async (id, options) => update(await bp.db.get(), id, options),
    updateTask: async (taskId, status, logs, returned) => updateTask(await bp.db.get(), taskId, status, logs, returned),
    delete: async id => remove(await bp.db.get(), id),
    deleteDone: async () => deleteDone(await bp.db.get()),
    listUpcoming: async () => listUpcoming(await bp.db.get()),
    listPrevious: async () => listPrevious(await bp.db.get()),
    listExpired: async () => listExpired(await bp.db.get()),
    scheduleNext: async (id, time) => scheduleNext(await bp.db.get(), id, time),
    reviveAllExecuting: async () => reviveAllExecuting(await bp.db.get())
  }
}

function initialize(knex) {
  return helpers(knex)
    .createTableIfNotExists('scheduler_schedules', function(table) {
      table.string('id').primary()
      table.boolean('enabled')
      table.string('schedule_type')
      table.string('schedule')
      table.string('schedule_human')
      table.timestamp('created_on')
      table.string('action')
    })
    .then(function() {
      return helpers(knex).createTableIfNotExists('scheduler_tasks', function(table) {
        table.increments('id')
        table
          .string('scheduleId')
          .references('scheduler_schedules.id')
          .onDelete('CASCADE')
        table.timestamp('scheduledOn')
        table.string('status')
        table.string('logs')
        table.timestamp('finishedOn')
        table.string('returned')
        table.unique(['scheduleId', 'scheduledOn'])
      })
    })
}

async function create(knex, id, options) {
  id = id || String(Math.random() * 100000000000000000000) // TODO: avoid possible duplicates
  options = validateCreateOptions(options)

  options.schedule_human = util.getHumanExpression(options.schedule_type, options.schedule)

  const firstOccurence = util.getNextOccurence(options.schedule_type, options.schedule).toDate()

  return knex('scheduler_schedules')
    .insert({
      id,
      created_on: helpers(knex).date.now(),
      ...options
    })
    .then(() => {
      if (options.enabled) {
        return scheduleNext(knex, id, firstOccurence)
      }
    })
    .then(() => Promise.resolve(id))
}

async function update(knex, id, options) {
  options = validateCreateOptions(options)

  return knex('scheduler_schedules')
    .where({ id })
    .update({ ...options })
}

async function updateTask(knex, taskId, status, logs, returned) {
  const options = { status, logs, returned }

  if (_.includes(['done', 'error', 'skipped'], status)) {
    options.finishedOn = helpers(knex).date.now()
  }

  return knex('scheduler_tasks')
    .where({ id: taskId })
    .update(options)
}

async function reviveAllExecuting(knex) {
  return knex('scheduler_tasks')
    .where({ status: 'executing' })
    .update({ status: 'pending' })
}

async function remove(knex, id) {
  return knex('scheduler_schedules')
    .where({ id })
    .del()
    .then(async () => deleteScheduled(knex, id))
}

async function listUpcoming(knex) {
  return knex('scheduler_tasks')
    .where({ status: 'pending' })
    .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
}

async function listPrevious(knex) {
  const dt = helpers(knex).date

  return knex('scheduler_tasks')
    .whereRaw(dt.isBefore('scheduledOn', dt.now()))
    .andWhere('status', '!=', 'pending')
    .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
}

async function listExpired(knex) {
  const dt = helpers(knex).date

  return knex('scheduler_tasks')
    .whereRaw(dt.isBefore('scheduledOn', dt.now()))
    .andWhere('status', '=', 'pending')
    .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
    .select(['scheduler_tasks.id as taskId', '*'])
}

async function deleteScheduled(knex, id) {
  return knex('scheduler_tasks')
    .where({ scheduleId: id })
    .del()
}

async function scheduleNext(knex, id, time) {
  // Round the time to the nearest 2 seconds
  const coeff = 1000 * 2
  const rounded = new Date(Math.round(time.getTime() / coeff) * coeff)

  const ts = helpers(knex).date.format(rounded)

  return knex('scheduler_tasks').insert({
    scheduleId: id,
    scheduledOn: ts,
    status: 'pending'
  })
}

async function deleteDone(knex) {
  return knex('scheduler_tasks')
    .whereNotNull('finishedOn')
    .del()
}

function validateCreateOptions(options) {
  const args = Validate.named(options, {
    enabled: 'boolean',
    schedule_type: 'string',
    schedule: 'string',
    action: 'string'
  })

  if (!args.isValid()) {
    throw args.errorString()
  }

  util.validateExpression(options.schedule_type, options.schedule)

  return _.pick(options, ['enabled', 'schedule_type', 'schedule', 'action'])
}

function validateModifyOptions(options) {
  const args = Validate.named(options, {
    enabled: 'boolean',
    action: 'string'
  })

  if (!args.isValid()) {
    throw args.errorString()
  }

  return _.pick(options, ['enabled', 'action'])
}
