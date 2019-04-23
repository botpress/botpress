import { Logger } from 'botpress/sdk'
import { defaultAdminRole, defaultRoles, defaultUserRole } from 'common/default-roles'
import { ConfigProvider } from 'core/config/config-loader'
import { AuthRole, AuthUser, BasicAuthUser, ExternalAuthUser, Pipeline, Workspace } from 'core/misc/interfaces'
import { Statistics } from 'core/stats'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import { GhostService } from './ghost/service'

const DEFAULT_USER_ATTRIBUTES = [
  'email',
  'company',
  'created_on',
  'firstname',
  'fullName',
  'last_ip',
  'last_logon',
  'lastname',
  'location',
  'role'
]

const DEFAULT_PIPELINE: Pipeline = [
  {
    id: 'prod',
    label: 'Production',
    action: 'promote_copy'
  }
]

const DEFAULT_WORKSPACE: Workspace = {
  name: 'Default',
  userSeq: 0,
  users: [],
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
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Statistics) private stats: Statistics
  ) {}

  async initialize(): Promise<void> {
    await this.getWorkspace().catch(async () => {
      await this.save({ ...DEFAULT_WORKSPACE })
      this.logger.info('Created workspace')
    })
  }

  async getWorkspace(): Promise<Workspace> {
    const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
    if (!workspaces || !workspaces.length) {
      throw new Error('No workspace found in workspaces.json')
    }

    return workspaces[0]
  }

  async save(workspace: Workspace) {
    await this.ghost.global().upsertFile('/', `workspaces.json`, JSON.stringify([workspace], undefined, 2))
  }

  async addBotRef(botId: string): Promise<void> {
    const workspace = await this.getWorkspace()
    workspace.bots.push(botId)
    await this.save(workspace)
  }

  async deleteBotRef(botId: any): Promise<void> {
    const workspace = await this.getWorkspace()
    const index = workspace.bots.findIndex(x => x === botId)
    workspace.bots.splice(index, 1)
    await this.save(workspace)
  }

  async getBotRefs(): Promise<string[]> {
    const workspace = await this.getWorkspace()
    return workspace.bots
  }

  async listUsers(selectFields?: Array<keyof AuthUser>): Promise<Partial<AuthUser[]>> {
    const workspace = await this.getWorkspace()
    if (!selectFields) {
      return workspace.users
    } else {
      return _.map(workspace.users, x => _.pick(x, selectFields))
    }
  }

  async assertUserExists(email: string): Promise<void> {
    const user = await this.findUser({ email })
    if (!user) {
      throw new Error(`User "${email}" is not a part of the workspace`)
    }
  }

  async findUser(where: {}, selectFields?: Array<keyof AuthUser> | '*'): Promise<Partial<AuthUser> | undefined> {
    const workspace = await this.getWorkspace()
    const user = _.head(_.filter<AuthUser>(workspace.users, where))

    if (!user) {
      return undefined
    }

    if (selectFields === '*') {
      return user
    }

    return _.pick<AuthUser>(user, ...(selectFields || DEFAULT_USER_ATTRIBUTES)) as Partial<AuthUser>
  }

  async findRole(roleId: string): Promise<AuthRole> {
    const workspace = await this.getWorkspace()
    const role = workspace.roles.find(r => r.id === roleId)
    if (!role) {
      throw new Error(`Role "${roleId}" does not exists in workspace "${workspace.name}"`)
    }
    return role
  }

  async getRoleForUser(email: string): Promise<AuthRole | undefined> {
    const user = await this.findUser({ email })!
    return user && this.findRole(user.role!)
  }

  async createUser(authUser: BasicAuthUser | ExternalAuthUser): Promise<AuthUser> {
    const workspace = await this.getWorkspace()
    const newUser = {
      ...authUser,
      created_on: new Date()
    } as AuthUser

    // If there's no users, make the first account's role as Admin
    if (!workspace.users.length) {
      newUser.role = workspace.adminRole
      await this.configProvider.mergeBotpressConfig({ superAdmins: [newUser.email] })
    }

    workspace.users.push(newUser)
    await this.save(workspace)

    return newUser
  }

  async updateUser(email: string, userData: Partial<AuthUser>) {
    this.stats.track('user', 'update')

    const workspace = await this.getWorkspace()
    const original = (await this.findUser({ email }, '*')) as AuthUser
    if (!original) {
      throw Error('Cannot find user')
    }

    const newUser: AuthUser = {
      ...original,
      ...userData
    }

    const idx = _.findIndex(workspace.users, x => x.email === email)
    workspace.users.splice(idx, 1, newUser)

    await this.save(workspace)
  }

  async deleteUser(email: string) {
    this.stats.track('user', 'delete')

    const workspace = await this.getWorkspace()
    const index = _.findIndex(workspace.users, x => x.email === email)

    if (index > -1) {
      workspace.users.splice(index, 1)
      await this.save(workspace)
    }
  }

  async getPipeline(): Promise<Pipeline> {
    const workspace = await this.getWorkspace()
    // @deprecated > 11: this ensures that the workspace includes a pipeline which are now created by default
    if (!workspace.pipeline) {
      workspace.pipeline = [...DEFAULT_PIPELINE]
      await this.save(workspace)
    }

    return workspace.pipeline
  }

  async hasPipeline(): Promise<boolean> {
    return (await this.getPipeline()).length > 1
  }
}
