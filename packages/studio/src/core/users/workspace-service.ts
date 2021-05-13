import {
  GetWorkspaceUsersOptions,
  Logger,
  RolloutStrategy,
  StrategyUser,
  WorkspaceUser,
  WorkspaceUserWithAttributes
} from 'botpress/sdk'
import { AuthRole, Pipeline, Workspace } from 'common/typings'
import { TYPES } from 'core/app/types'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { NotFoundError } from 'core/routers'
import { StrategyUsersRepository, WorkspaceUsersRepository } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

export const CHAT_USER_ROLE = {
  id: 'chatuser',
  name: 'Chat User',
  description: 'Chat users have limited access to bots.',
  rules: [
    {
      res: '*',
      op: '-r-w'
    },
    {
      res: 'user.bots',
      op: '+r'
    }
  ]
}

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

  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', 'workspaces.json')
    if (!workspaces || !workspaces.length) {
      throw new Error('No workspace found in workspaces.json')
    }

    return workspaces
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

  async findUser(email: string, strategy: string, workspace: string) {
    const list = await this.workspaceRepo.getUserWorkspaces(email, strategy)
    return list.find(x => x.workspace === workspace)
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
}
