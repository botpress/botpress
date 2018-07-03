import _ from 'lodash'
import { DatabaseHelpers as helpers } from 'botpress'

const Validate = require('validate-arguments')

import util from './util.js'

module.exports = bp => {
  return {
    bootstrap: () => {
      return bp.db.get().then(initialize)
    },
    create: (id, options) => {
      return bp.db.get().then(knex => create(knex, id, options))
    },
    update: (id, options) => {
      return bp.db.get().then(knex => update(knex, id, options))
    },
    updateTask: (taskId, status, logs, returned) => {
      return bp.db.get().then(knex => updateTask(knex, taskId, status, logs, returned))
    },
    delete: id => {
      return bp.db.get().then(knex => remove(knex, id))
    },
    deleteDone: () => {
      return bp.db.get().then(knex => deleteDone(knex))
    },
    listUpcoming: () => {
      return bp.db.get().then(knex => listUpcoming(knex))
    },
    listPrevious: () => {
      return bp.db.get().then(knex => listPrevious(knex))
    },
    listExpired: () => {
      return bp.db.get().then(knex => listExpired(knex))
    },
    scheduleNext: (id, time) => {
      return bp.db.get().then(knex => scheduleNext(knex, id, time))
    },
    reviveAllExecuting: () => {
      return bp.db.get().then(knex => reviveAllExecuting(knex))
    }
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

function create(knex, id, options) {
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

function update(knex, id, options) {
  options = validateCreateOptions(options)

  return knex('scheduler_schedules')
    .where({ id })
    .update({ ...options })
    .then()
}

function updateTask(knex, taskId, status, logs, returned) {
  const options = { status, logs, returned }

  if (_.includes(['done', 'error', 'skipped'], status)) {
    options.finishedOn = helpers(knex).date.now()
  }

  return knex('scheduler_tasks')
    .where({ id: taskId })
    .update(options)
    .then()
}

function reviveAllExecuting(knex) {
  return knex('scheduler_tasks')
    .where({ status: 'executing' })
    .update({ status: 'pending' })
    .then()
}

function remove(knex, id) {
  return knex('scheduler_schedules')
    .where({ id })
    .del()
    .then(() => deleteScheduled(knex, id))
}

function listUpcoming(knex) {
  return knex('scheduler_tasks')
    .where({ status: 'pending' })
    .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
    .then()
}

function listPrevious(knex) {
  const dt = helpers(knex).date

  return knex('scheduler_tasks')
    .whereRaw(dt.isBefore('scheduledOn', dt.now()))
    .andWhere('status', '!=', 'pending')
    .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
    .then()
}

function listExpired(knex) {
  const dt = helpers(knex).date

  return knex('scheduler_tasks')
    .whereRaw(dt.isBefore('scheduledOn', dt.now()))
    .andWhere('status', '=', 'pending')
    .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
    .select(['scheduler_tasks.id as taskId', '*'])
    .then()
}

function deleteScheduled(knex, id) {
  return knex('scheduler_tasks')
    .where({ scheduleId: id })
    .del()
    .then()
}

function scheduleNext(knex, id, time) {
  // Round the time to the nearest 2 seconds
  const coeff = 1000 * 2
  const rounded = new Date(Math.round(time.getTime() / coeff) * coeff)

  const ts = helpers(knex).date.format(rounded)

  return knex('scheduler_tasks')
    .insert({
      scheduleId: id,
      scheduledOn: ts,
      status: 'pending'
    })
    .then()
}

function deleteDone(knex) {
  return knex('scheduler_tasks')
    .whereNotNull('finishedOn')
    .del()
    .then()
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
