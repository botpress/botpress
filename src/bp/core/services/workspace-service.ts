import { AddWorkspaceUserOptions, Logger, RolloutStrategy, WorkspaceRollout } from 'botpress/sdk'
import { CHAT_USER_ROLE, defaultPipelines, defaultWorkspace } from 'common/defaults'
import { AuthRole, CreateWorkspace, Pipeline, Workspace, WorkspaceUser } from 'common/typings'
import { WorkspaceInviteCode, WorkspaceInviteCodesRepository } from 'core/repositories'
import { StrategyUsersRepository } from 'core/repositories/strategy_users'
import { WorkspaceUserAttributes, WorkspaceUsersRepository } from 'core/repositories/workspace_users'
import { BadRequestError, ConflictError, NotFoundError } from 'core/routers/errors'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import nanoid from 'nanoid/generate'

import { TYPES } from '../types'

import { InvalidOperationError } from './auth/errors'
import { GhostService } from './ghost/service'

export const ROLLOUT_STRATEGIES: RolloutStrategy[] = [
  'anonymous',
  'anonymous-invite',
  'authenticated',
  'authenticated-invite',
  'authorized'
]

const UNLIMITED = -1

@injectable()
export class WorkspaceService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'WorkspaceService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.WorkspaceUsersRepository) private workspaceRepo: WorkspaceUsersRepository,
    @inject(TYPES.StrategyUsersRepository) private usersRepo: StrategyUsersRepository,
    @inject(TYPES.WorkspaceInviteCodesRepository) private inviteCodesRepo: WorkspaceInviteCodesRepository
  ) {}

  async initialize(): Promise<void> {
    await this.getWorkspaces().catch(async () => {
      await this.save([defaultWorkspace])
      this.logger.info('Created workspace')
    })
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
    if (!workspaces || !workspaces.length) {
      throw new Error('No workspace found in workspaces.json')
    }

    return workspaces
  }

  async save(workspaces: Workspace[]): Promise<void> {
    return this.ghost.global().upsertFile('/', `workspaces.json`, JSON.stringify(workspaces, undefined, 2))
  }

  async mergeWorkspaceConfig(workspaceId: string, partialData: Partial<Workspace>) {
    const workspaces = await this.getWorkspaces()
    if (!workspaces.find(x => x.id === workspaceId)) {
      throw new NotFoundError(`Workspace doesn't exist`)
    }

    return this.save(workspaces.map(wks => (wks.id === workspaceId ? { ...wks, ...partialData } : wks)))
  }

  async addBotRef(botId: string, workspaceId: string): Promise<void> {
    const workspaces = await this.getWorkspaces()
    const workspace = workspaces.find(x => x.id === workspaceId)

    if (!workspace) {
      throw new Error(`Specified workspace "${workspaceId}" doesn't exist`)
    }

    workspace.bots.push(botId)
    return this.save(workspaces)
  }

  async deleteBotRef(botId: any): Promise<void> {
    const workspaces = await this.getWorkspaces()

    const botWorkspaceId = await this.getBotWorkspaceId(botId)
    const workspace = workspaces.find(x => x.id === botWorkspaceId)

    if (!workspace) {
      throw new Error(`Specified workspace "${botWorkspaceId}" doesn't exist`)
    }

    const index = workspace.bots.findIndex(x => x === botId)
    if (index === -1) {
      return
    }
    workspace.bots.splice(index, 1)
    return this.save(workspaces)
  }

  async getBotRefs(workspaceId?: string): Promise<string[]> {
    if (!workspaceId) {
      const workspace = await this.getWorkspaces()
      return _.flatten(workspace.map(x => x.bots))
    } else {
      const workspace = await this.findWorkspace(workspaceId)
      return (workspace && workspace.bots) || []
    }
  }

  async findWorkspace(workspaceId: string): Promise<Workspace> {
    const workspaces = await this.getWorkspaces()

    const workspace = workspaces.find(x => x.id === workspaceId)
    if (!workspace) {
      throw new NotFoundError(`Unknown workspace`)
    }

    return workspace
  }

  async findWorkspaceName(workspaceId: string): Promise<string> {
    const all = await this.getWorkspaces()
    const workspace = all.find(x => x.id === workspaceId)
    return (workspace && workspace.name) || workspaceId
  }

  async createWorkspace(workspace: CreateWorkspace): Promise<void> {
    const workspaces = await this.getWorkspaces()
    if (workspaces.find(x => x.id === workspace.id)) {
      throw new ConflictError(`A workspace with that id "${workspace.id}" already exists`)
    }

    if (!defaultPipelines[workspace.pipelineId]) {
      throw new InvalidOperationError(`Invalid pipeline`)
    }

    const newWorkspace = {
      ...defaultWorkspace,
      ..._.pick(workspace, ['id', 'name', 'description', 'audience']),
      pipeline: defaultPipelines[workspace.pipelineId]
    }

    workspaces.push(newWorkspace)
    return this.save(workspaces)
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspaces = await this.getWorkspaces()
    if (!workspaces.find(x => x.id === workspaceId)) {
      throw new NotFoundError(`Workspace doesn't exist`)
    }

    return this.save(workspaces.filter(x => x.id !== workspaceId))
  }

  async addUserToWorkspace(email: string, strategy: string, workspaceId: string, options?: AddWorkspaceUserOptions) {
    if (!(await this.usersRepo.findUser(email, strategy))) {
      throw new Error(`Specified user doesn't exist`)
    }

    const workspace = await this.findWorkspace(workspaceId)
    let role = workspace.defaultRole

    if (options) {
      if (options.role) {
        role = options.role
      } else if (options.asAdmin) {
        role = workspace.adminRole
      } else if (options.asChatUser) {
        role = CHAT_USER_ROLE.id
      }
    }

    await this.workspaceRepo.createEntry({ email, strategy, workspace: workspaceId, role })
  }

  async getWorkspaceRollout(workspaceId: string): Promise<WorkspaceRollout> {
    const { rolloutStrategy } = await this.findWorkspace(workspaceId)

    if (!rolloutStrategy) {
      return { rolloutStrategy: 'anonymous' }
    }

    if (rolloutStrategy === 'anonymous-invite' || rolloutStrategy === 'authenticated-invite') {
      let invite = await this.inviteCodesRepo.getWorkspaceCode(workspaceId)

      // Invite code can be empty if workspaces was modified manually
      if (!invite) {
        invite = await this.resetInviteCode(workspaceId)
      }

      return { rolloutStrategy, ...invite }
    }

    return { rolloutStrategy }
  }

  async resetInviteCode(workspaceId: string, allowedUsages: number = UNLIMITED): Promise<WorkspaceInviteCode> {
    const inviteCode = `INV-${nanoid('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)}`
    const newEntry = { workspaceId, inviteCode, allowedUsages }

    if (await this.inviteCodesRepo.getWorkspaceCode(workspaceId)) {
      await this.inviteCodesRepo.replaceCode(newEntry)
    } else {
      await this.inviteCodesRepo.createEntry(newEntry)
    }

    return newEntry
  }

  async consumeInviteCode(workspaceId: string, validateCode?: string): Promise<boolean> {
    const { allowedUsages, inviteCode } = await this.inviteCodesRepo.getWorkspaceCode(workspaceId)

    if (allowedUsages === 0 || (validateCode && inviteCode !== validateCode)) {
      return false
    }

    if (allowedUsages !== -1) {
      await this.inviteCodesRepo.decreaseRemainingUsage(workspaceId)
    }

    return true
  }

  async removeUserFromAllWorkspaces(email: string, strategy: string) {
    const allWorkspaces = await this.getUserWorkspaces(email, strategy)
    return Promise.map(allWorkspaces, wks => this.removeUserFromWorkspace(email, strategy, wks.workspace))
  }

  async removeUserFromWorkspace(email: string, strategy: string, workspace: string) {
    return this.workspaceRepo.removeUserFromWorkspace(email, strategy, workspace)
  }

  async updateUserRole(email: string, strategy: string, workspace: string, newRole: string) {
    return this.workspaceRepo.updateUserRole(email, strategy, workspace, newRole)
  }

  async findUser(email: string, strategy: string, workspace: string) {
    const list = await this.workspaceRepo.getUserWorkspaces(email, strategy)
    return list.find(x => x.workspace === workspace)
  }

  async getUserWorkspaces(email: string, strategy: string): Promise<WorkspaceUser[]> {
    const userWorkspaces = await this.workspaceRepo.getUserWorkspaces(email, strategy)
    return Promise.map(userWorkspaces, async userWorkspace => ({
      ...userWorkspace,
      workspaceName: await this.findWorkspaceName(userWorkspace.workspace)
    }))
  }

  async getWorkspaceUsers(workspace: string) {
    return this.workspaceRepo.getWorkspaceUsers(workspace)
  }

  async getWorkspaceUsersAttributes(
    workspace: string,
    filteredAttributes?: string[]
  ): Promise<WorkspaceUserAttributes[]> {
    const workspaceUsers = await this.workspaceRepo.getWorkspaceUsers(workspace)
    const uniqStrategies = _.uniq(_.map(workspaceUsers, 'strategy'))
    const usersInfo = await this._getUsersAttributes(workspaceUsers, uniqStrategies, filteredAttributes)

    return workspaceUsers.map(u => ({ ...u, attributes: usersInfo[u.email.toLowerCase()] }))
  }

  private async _getUsersAttributes(users: WorkspaceUser[], strategies: string[], attributes: any) {
    const attr = {}
    const usersInfo = _.flatten(
      await Promise.map(strategies, strategy => this._getUsersInfoForStrategy(users, strategy, attributes))
    )

    usersInfo.forEach(u => (attr[u.email] = { ...u.attributes, createdOn: u.createdOn, updatedOn: u.updatedOn }))
    return attr
  }

  private async _getUsersInfoForStrategy(users: WorkspaceUser[], strategy: string, attributes: any) {
    const emails = users.filter(x => x.strategy === strategy).map(x => x.email)
    return this.usersRepo.getMultipleUserAttributes(emails, strategy, attributes)
  }

  async getUniqueCollaborators(): Promise<number> {
    return this.workspaceRepo.getUniqueCollaborators()
  }

  async findRole(roleId: string, workspaceId: string): Promise<AuthRole> {
    const workspace = await this.findWorkspace(workspaceId)
    const role = [...workspace.roles, CHAT_USER_ROLE].find(r => r.id === roleId)

    if (!role) {
      throw new NotFoundError(`Role "${roleId}" does not exist in workspace "${workspace.name}"`)
    }
    return role
  }

  async getBotWorkspaceId(botId: string) {
    const workspaces = await this.getWorkspaces()
    const workspace = workspaces.find(x => !!x.bots.find(bot => bot === botId))
    return workspace?.id ?? 'default'
  }

  async getRoleForUser(email: string, strategy: string, workspace: string): Promise<AuthRole | undefined> {
    const user = await this.findUser(email, strategy, workspace)!
    return user && this.findRole(user.role!, workspace)
  }

  async getPipeline(workspaceId: string): Promise<Pipeline | undefined> {
    const workspaces = await this.getWorkspaces()
    const workspace = workspaces.find(x => x.id === workspaceId)

    return workspace?.pipeline
  }

  async hasPipeline(workspaceId: string): Promise<boolean> {
    const pipeline = await this.getPipeline(workspaceId)
    return !!pipeline && pipeline.length > 1
  }

  async listUsers(workspaceId?: string): Promise<WorkspaceUser[]> {
    if (workspaceId) {
      return this.getWorkspaceUsers(workspaceId)
    }

    const workspaces = await this.getWorkspaces()
    let wu: WorkspaceUser[] = []
    for (const w of workspaces) {
      const u = await this.getWorkspaceUsers(w.id)
      wu = [...wu, ...u]
    }
    return wu
  }
}
