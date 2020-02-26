import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

@injectable()
export class TasksRepository {
  private readonly tableName = 'tasks'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async createTask(
    eventId: string,
    actionName: string,
    actionArgs: any,
    actionServerId: string
  ): Promise<number> {
    return await this.database.knex.insertAndRetrieve(
      this.tableName,
      {
        eventId,
        status: 'started',
        actionName,
        actionArgs: this.database.knex.json.set(actionArgs),
        actionServerId
      },
      ['id']
    )
  }

  public async completeTask(taskId: number, responseStatusCode: number) {
    await this.database.knex.where({ id: taskId }).update({
      status: 'completed',
      responseStatusCode: responseStatusCode,
      responseReceivedAt: this.database.knex.date.now()
    })
  }
}
