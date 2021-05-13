import { WorkspaceUser } from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

@injectable()
export class WorkspaceUsersRepository {
  private readonly tableName = 'workspace_users'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async getUserWorkspaces(email: string, strategy: string): Promise<WorkspaceUser[]> {
    if (!email || !strategy) {
      throw new Error('Email and Strategy are mandatory')
    }

    return this.database
      .knex(this.tableName)
      .select('*')
      .where({ strategy })
      .andWhere(this.database.knex.raw('LOWER(email) = ?', [email.toLowerCase()]))
  }
}
