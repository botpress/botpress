import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'

import Database from '../database'
import { TYPES } from '../types'

export interface WorkspaceUser {
  email: string
  strategy: string
  workspace: string
  role: string
}

@injectable()
export class WorkspaceUsersRepository {
  private readonly tableName = 'workspace_users'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async createEntry(workspaceUser: WorkspaceUser): Knex.GetOrCreateResult<WorkspaceUser> {
    const newUser = await this.database.knex
      .insertAndRetrieve<WorkspaceUser>(
        this.tableName,
        {
          email: workspaceUser.email,
          strategy: workspaceUser.strategy,
          workspace: workspaceUser.workspace,
          role: workspaceUser.role
        },
        ['email', 'strategy', 'workspace', 'role', 'created_at', 'updated_at']
      )
      .then(res => {
        return {
          email: res.email,
          strategy: res.strategy,
          workspace: res.workspace,
          role: res.role,
          createdOn: res['created_at'],
          updatedOn: res['updated_at']
        }
      })

    return { result: newUser, created: true }
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

  async getUniqueCollaborators() {
    return this.database
      .knex(this.tableName)
      .groupBy(['email', 'strategy'])
      .count('* as qty')
      .first()
      .then(result => result.qty)
  }
}
