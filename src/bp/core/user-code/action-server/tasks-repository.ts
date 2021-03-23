import { Logger } from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import ms from 'ms'

export type TaskInfoStatus = 'completed' | 'failed'

export interface TaskInfo {
  eventId: string
  actionName: string
  actionArgs: any
  actionServerId: string
  statusCode?: number
  startedAt: Date
  endedAt: Date
  status: TaskInfoStatus
  failureReason?: string
}

@injectable()
export class TasksRepository {
  private readonly TABLE_NAME = 'tasks'
  private readonly BATCH_SIZE = 100
  private readonly INTERVAL = ms('5s')
  private batch: TaskInfo[] = []
  private currentPromise
  private initialized = false

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger) @tagged('name', 'TasksRepository') private logger: Logger
  ) {}

  private runTask = () => {
    if (this.currentPromise || this.batch.length === 0) {
      return
    }

    const batchCount = this.batch.length >= this.BATCH_SIZE ? this.BATCH_SIZE : this.batch.length
    const elements = this.batch.splice(0, batchCount)

    this.currentPromise = this.database.knex
      .batchInsert(
        this.TABLE_NAME,
        elements.map(e => ({
          ...e,
          actionArgs: this.database.knex.json.set(e.actionArgs || {})
        })),
        this.BATCH_SIZE
      )
      .catch(err => {
        this.logger
          .attachError(err)
          .persist(false)
          .error('Error persisting tasks')
        this.batch.push(...elements)
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  public createTask(taskInfo: TaskInfo) {
    if (!this.initialized) {
      setInterval(this.runTask, this.INTERVAL)
    }

    this.batch.push(taskInfo)
  }
}
