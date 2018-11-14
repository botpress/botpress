import _ from 'lodash'

import { SDK } from '.'
import util from './util.js'
const Validate = require('validate-arguments')

export default class SchedulerDb {
  knex: any

  constructor(private bp: SDK) {
    this.knex = bp.database
  }

  initialize() {
    return this.knex
      .createTableIfNotExists('scheduler_schedules', function(table) {
        table.string('id').primary()
        table.boolean('enabled')
        table.string('schedule_type')
        table.string('schedule')
        table.string('schedule_human')
        table.timestamp('created_on')
        table.string('action')
      })
      .then(() => {
        return this.knex.createTableIfNotExists('scheduler_tasks', function(table) {
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

  create(id, options) {
    id = id || String(Math.random() * 100000000000000000000) // TODO: avoid possible duplicates
    options = this.validateCreateOptions(options)

    options.schedule_human = util.getHumanExpression(options.schedule_type, options.schedule)

    const firstOccurence = util.getNextOccurence(options.schedule_type, options.schedule).toDate()

    return this.knex('scheduler_schedules')
      .insert({
        id,
        created_on: this.knex.date.now(),
        ...options
      })
      .then(() => {
        if (options.enabled) {
          return this.scheduleNext(id, firstOccurence)
        }
      })
      .then(() => Promise.resolve(id))
  }

  update(id, options) {
    options = this.validateCreateOptions(options)

    return this.knex('scheduler_schedules')
      .where({ id })
      .update({ ...options })
      .then()
  }

  updateTask(taskId, status, logs, returned) {
    const options: any = { status, logs, returned }

    if (_.includes(['done', 'error', 'skipped'], status)) {
      options.finishedOn = this.knex.date.now()
    }

    return this.knex('scheduler_tasks')
      .where({ id: taskId })
      .update(options)
      .then()
  }

  reviveAllExecuting() {
    return this.knex('scheduler_tasks')
      .where({ status: 'executing' })
      .update({ status: 'pending' })
      .then()
  }

  delete(id) {
    return this.knex('scheduler_schedules')
      .where({ id })
      .del()
      .then(() => this.deleteScheduled(id))
  }

  listUpcoming() {
    return this.knex('scheduler_tasks')
      .where({ status: 'pending' })
      .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
      .then()
  }

  listPrevious() {
    const dt = this.knex.date

    return this.knex('scheduler_tasks')
      .whereRaw(dt.isBefore('scheduledOn', dt.now()))
      .andWhere('status', '!=', 'pending')
      .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
      .then()
  }

  listExpired() {
    const dt = this.knex.date

    return this.knex('scheduler_tasks')
      .whereRaw(dt.isBefore('scheduledOn', dt.now()))
      .andWhere('status', '=', 'pending')
      .join('scheduler_schedules', 'scheduler_tasks.scheduleId', 'scheduler_schedules.id')
      .select(['scheduler_tasks.id as taskId', '*'])
      .then()
  }

  deleteScheduled(id) {
    return this.knex('scheduler_tasks')
      .where({ scheduleId: id })
      .del()
      .then()
  }

  scheduleNext(id, time) {
    // Round the time to the nearest 2 seconds
    const coeff = 1000 * 2
    const rounded = new Date(Math.round(time.getTime() / coeff) * coeff)

    const ts = this.knex.date.format(rounded)

    return this.knex('scheduler_tasks')
      .insert({
        scheduleId: id,
        scheduledOn: ts,
        status: 'pending'
      })
      .then()
  }

  deleteDone() {
    return this.knex('scheduler_tasks')
      .whereNotNull('finishedOn')
      .del()
      .then()
  }

  validateCreateOptions(options) {
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

  validateModifyOptions(options) {
    const args = Validate.named(options, {
      enabled: 'boolean',
      action: 'string'
    })

    if (!args.isValid()) {
      throw args.errorString()
    }

    return _.pick(options, ['enabled', 'action'])
  }
}
