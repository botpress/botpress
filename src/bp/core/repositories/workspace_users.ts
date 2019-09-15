import { inject, injectable } from 'inversify'
import _ from 'lodash'

import Database from '../database'
import { TYPES } from '../types'

export interface WorkspaceUser {
  email: string
  strategy: string
  workspace: string
  role: string
}

export type WorkspaceUserAttributes = {
  attributes: any
} & WorkspaceUser

@injectable()
export class WorkspaceUsersRepository {
  private readonly tableName = 'workspace_users'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async createEntry(workspaceUser: WorkspaceUser): Promise<void> {
    return this.database.knex(this.tableName).insert({
      email: workspaceUser.email,
      strategy: workspaceUser.strategy,
      workspace: workspaceUser.workspace,
      role: workspaceUser.role
    })
  }

  async updateUserRole(email: string, strategy: string, workspace: string, role: string): Promise<void> {
    if (!email || !strategy || !workspace) {
      throw new Error('Email, Strategy and Workspace are mandatory')
    }

    await this.database
      .knex(this.tableName)
      .where({ email, strategy, workspace })
      .update({ role })
  }

  async removeUserFromWorkspace(email: string, strategy: string, workspace: string) {
    return this.database
      .knex(this.tableName)
      .where({ email, strategy, workspace })
      .del()
  }

  async getUserWorkspaces(email: string, strategy: string): Promise<WorkspaceUser[]> {
    if (!email || !strategy) {
      throw new Error('Email and Strategy are mandatory')
    }

    return this.database
      .knex(this.tableName)
      .select('*')
      .where({ email, strategy })
  }

  async getWorkspaceUsers(workspace: string): Promise<WorkspaceUser[]> {
    return this.database
      .knex(this.tableName)
      .select('*')
      .where({ workspace })
  }

  async getUniqueCollaborators(strategy?: string) {
    let query = this.database
      .knex(this.tableName)
      .groupBy(['email', 'strategy'])
      .count('* as qty')

    if (strategy) {
      query = query.where({ strategy })
    }

    return query.first().then(result => (result && result.qty) || 0)
  }
}
