import { Logger } from 'botpress/sdk'
import { defaultPipelines, defaultWorkspace } from 'common/defaults'
import { AuthRole, CreateWorkspace, Pipeline, Workspace, WorkspaceUser } from 'common/typings'
import { StrategyUsersRepository } from 'core/repositories/strategy_users'
import { WorkspaceUserAttributes, WorkspaceUsersRepository } from 'core/repositories/workspace_users'
import { ConflictError, NotFoundError } from 'core/routers/errors'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import { InvalidOperationError } from './auth/errors'
import { GhostService } from './ghost/service'

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

  async addUserToWorkspace(
    email: string,
    strategy: string,
    workspaceId: string,
    role?: string,
    options?: { asAdmin?: boolean } // Temporary, will add chat user in another pr
  ) {
    if (!(await this.usersRepo.findUser(email, strategy))) {
      throw new Error(`Specified user doesn't exist`)
    }

    if (!role) {
      const workspace = await this.findWorkspace(workspaceId)
      if (!options) {
        role = workspace.defaultRole
      } else {
        role = workspace.adminRole
      }
    }

    await this.workspaceRepo.createEntry({ email, strategy, workspace: workspaceId, role })
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

    return workspaceUsers.map(u => ({ ...u, attributes: usersInfo[u.email] }))
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
    const role = workspace.roles.find(r => r.id === roleId)

    if (!role) {
      throw new NotFoundError(`Role "${roleId}" does not exists in workspace "${workspace.name}"`)
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
