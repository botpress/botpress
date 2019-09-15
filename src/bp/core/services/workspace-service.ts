import { Logger } from 'botpress/sdk'
import { defaultAdminRole, defaultRoles, defaultUserRole } from 'common/default-roles'
import { AuthRole, Pipeline, Workspace } from 'common/typings'
import { StrategyUsersRepository } from 'core/repositories/strategy_users'
import { WorkspaceUser, WorkspaceUsersRepository, WorkspaceUserAttributes } from 'core/repositories/workspace_users'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import { GhostService } from './ghost/service'

const DEFAULT_PIPELINE: Pipeline = [
  {
    id: 'prod',
    label: 'Production',
    action: 'promote_copy'
  }
]

const DEFAULT_WORKSPACE: Workspace = {
  id: 'default',
  name: 'Default',
  bots: [],
  roles: defaultRoles,
  defaultRole: defaultUserRole,
  adminRole: defaultAdminRole,
  pipeline: [...DEFAULT_PIPELINE]
}

@injectable()
export class WorkspaceService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'WorkspaceService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.WorkspaceUsersRepository) private workspaceRepo: WorkspaceUsersRepository,
    @inject(TYPES.StrategyUsersRepository) private usersRepo: StrategyUsersRepository
  ) {}

  async initialize(): Promise<void> {
    await this.getWorkspaces().catch(async () => {
      await this.save([{ ...DEFAULT_WORKSPACE }])
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

  async addBotRef(botId: string, workspaceId: string): Promise<void> {
    const workspaces = await this.getWorkspaces()
    const workspace = workspaces.find(x => x.id === workspaceId)

    if (!workspace) {
      throw new Error(`Specified workspace "${workspaceId}" doesn't exists`)
    }

    workspace.bots.push(botId)
    return this.save(workspaces)
  }

  async deleteBotRef(botId: any): Promise<void> {
    const workspaces = await this.getWorkspaces()

    const botWorkspaceId = await this.getBotWorkspaceId(botId)
    const workspace = workspaces.find(x => x.id === botWorkspaceId)

    if (!workspace) {
      throw new Error(`Specified workspace "${botWorkspaceId}" doesn't exists`)
    }

    const index = workspace.bots.findIndex(x => x === botId)
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

  async findWorkspace(workspaceId: string): Promise<Workspace | undefined> {
    const all = await this.getWorkspaces()
    return all.find(x => x.id === workspaceId)
  }

  async createWorkspace(workspaceId: string, workspaceName: string): Promise<void> {
    const workspaces = await this.getWorkspaces()
    if (workspaces.find(x => x.id === workspaceId)) {
      throw new Error(`Workspace with id "${workspaceId}" already exists`)
    }

    workspaces.push({ ...DEFAULT_WORKSPACE, id: workspaceId, name: workspaceName })
    return this.save(workspaces)
  }

  async addWorkspaceAdmin(email: string, strategy: string, workspaceId: string) {
    const workspace = await this.findWorkspace(workspaceId)
    if (workspace) {
      return this.addUserToWorkspace(email, strategy, workspace.id, workspace.adminRole)
    }
  }

  async addWorkspaceUser(email: string, strategy: string, workspaceId: string) {
    const workspace = await this.findWorkspace(workspaceId)
    if (workspace) {
      return this.addUserToWorkspace(email, strategy, workspace.id, workspace.defaultRole)
    }
  }

  async addUserToWorkspace(email: string, strategy: string, workspace: string, role: string) {
    const user = {
      email,
      strategy,
      workspace,
      role
    }
    await this.workspaceRepo.createEntry(user)
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
    return this.workspaceRepo.getUserWorkspaces(email, strategy)
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

    return workspaceUsers.map(u => ({ ...u, attributes: usersInfo[u.email] }))
  }

  private async _getUsersAttributes(users: WorkspaceUser[], strategies: string[], attributes: any) {
    let attr = {}
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
    const role = workspace && workspace.roles.find(r => r.id === roleId)

    if (!role) {
      throw new Error(`Role "${roleId}" does not exists in workspace "${workspace!.name}"`)
    }
    return role
  }

  async getBotWorkspaceId(botId: string) {
    const workspaces = await this.getWorkspaces()
    const workspace = workspaces.find(x => !!x.bots.find(bot => bot === botId))
    return (workspace && workspace.id) || 'default'
  }

  async getRoleForUser(email: string, strategy: string, workspace: string): Promise<AuthRole | undefined> {
    const user = await this.findUser(email, strategy, workspace)!
    return user && this.findRole(user.role!, workspace)
  }

  async getPipeline(workspaceId: string): Promise<Pipeline | undefined> {
    const workspaces = await this.getWorkspaces()
    const workspace = workspaces.find(x => x.id === workspaceId)

    return workspace && workspace.pipeline
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
