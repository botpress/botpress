import {
  AddWorkspaceUserOptions,
  GetWorkspaceUsersOptions,
  Logger,
  RolloutStrategy,
  StrategyUser,
  WorkspaceRollout,
  WorkspaceUser,
  WorkspaceUserWithAttributes
} from 'botpress/sdk'
import { CHAT_USER_ROLE, defaultPipelines, defaultWorkspace } from 'common/defaults'
import { AuthRole, CreateWorkspace, Pipeline, Workspace } from 'common/typings'
import { TYPES } from 'core/app/types'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { InvalidOperationError, ConflictError, NotFoundError } from 'core/routers'
import { StrategyUsersRepository, WorkspaceUsersRepository } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import nanoid from 'nanoid/generate'

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
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  async initialize(): Promise<void> {
    await this.getWorkspaces().catch(async () => {
      await this.save([defaultWorkspace])
      this.logger.info('Created workspace')
    })
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', 'workspaces.json')
    if (!workspaces || !workspaces.length) {
      throw new Error('No workspace found in workspaces.json')
    }

    return workspaces
  }

  async save(workspaces: Workspace[]): Promise<void> {
    return this.ghost.global().upsertFile('/', 'workspaces.json', JSON.stringify(workspaces, undefined, 2))
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
      throw new NotFoundError('Unknown workspace')
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
      throw new InvalidOperationError('Invalid pipeline')
    }

    const newWorkspace = {
      ...defaultWorkspace,
      ..._.pick(workspace, ['id', 'name', 'description', 'audience']),
      pipeline: defaultPipelines[workspace.pipelineId]
    }

    workspaces.push(newWorkspace)
    return this.save(workspaces)
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

  async getWorkspaceUsers(
    workspace: string,
    options: Partial<GetWorkspaceUsersOptions> = {}
  ): Promise<WorkspaceUser[] | WorkspaceUserWithAttributes[]> {
    const opts: GetWorkspaceUsersOptions = { attributes: [], includeSuperAdmins: false, ...options }

    const superAdmins = opts.includeSuperAdmins ? await this.getSuperAdmins(workspace) : []
    const workspaceUsers = [...superAdmins, ...(await this.workspaceRepo.getWorkspaceUsers(workspace))]

    if (!opts.attributes.length || (typeof opts.attributes === 'string' && opts.attributes !== '*')) {
      return workspaceUsers
    }

    const uniqStrategies = _(workspaceUsers)
      .map('strategy')
      .uniq()
      .value()
    const attrToFetch = opts.attributes === '*' ? undefined : opts.attributes
    const allUsersAttrs = await this._getUsersAttributes(workspaceUsers, uniqStrategies, attrToFetch)

    return workspaceUsers.map(u => ({
      ..._.omit(u, ['password', 'salt']),
      attributes: allUsersAttrs[u.email.toLowerCase()]
    })) as WorkspaceUserWithAttributes[]
  }

  private async getSuperAdmins(workspace: string): Promise<WorkspaceUser[]> {
    return (await this.configProvider.getBotpressConfig()).superAdmins.map(u => ({
      ...(u as StrategyUser),
      role: 'admin', // purposefully marked as admin and not superadmin
      workspace
    }))
  }

  private async _getUsersAttributes(
    users: WorkspaceUser[],
    strategies: string[],
    attributes: string[] | undefined
  ): Promise<{ [email: string]: object }> {
    const userStrategyInfo = await Promise.map(strategies, strategy => {
      const emails = users.filter(u => u.strategy === strategy).map(u => u.email)
      return this.usersRepo.getMultipleUserAttributes(emails, strategy, attributes)
    })

    return _.flatten(userStrategyInfo).reduce((attrs, userInfo) => {
      attrs[userInfo.email] = { ...attrs[userInfo.email], ...userInfo.attributes }
      return attrs
    }, {})
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
}
