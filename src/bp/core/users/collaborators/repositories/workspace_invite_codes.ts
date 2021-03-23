import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

export interface WorkspaceInviteCode {
  workspaceId: string
  inviteCode: string
  allowedUsages: number
}

@injectable()
export class WorkspaceInviteCodesRepository {
  private readonly tableName = 'workspace_invite_codes'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async createEntry(workspaceCode: WorkspaceInviteCode): Promise<void> {
    return this.database.knex(this.tableName).insert({
      workspaceId: workspaceCode.workspaceId,
      inviteCode: workspaceCode.inviteCode,
      allowedUsages: workspaceCode.allowedUsages
    })
  }

  async replaceCode(workspaceCode: WorkspaceInviteCode): Promise<void> {
    const { workspaceId, inviteCode, allowedUsages } = workspaceCode

    return this.database
      .knex(this.tableName)
      .where({ workspaceId })
      .update({ inviteCode, allowedUsages })
  }

  async getWorkspaceCode(workspaceId: string): Promise<WorkspaceInviteCode> {
    if (!workspaceId) {
      throw new Error('Workspace ID is required')
    }

    return this.database
      .knex(this.tableName)
      .select('*')
      .where({ workspaceId })
      .first()
  }

  async decreaseRemainingUsage(workspaceId: string): Promise<void> {
    const code = await this.getWorkspaceCode(workspaceId)

    return this.database
      .knex(this.tableName)
      .where({ workspaceId })
      .update({ allowedUsages: code.allowedUsages - 1 })
  }
}
