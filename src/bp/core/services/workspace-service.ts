import { Logger } from 'botpress/sdk'
import { defaultAdminRole, defaultRoles, defaultUserRole } from 'common/default-roles'
import { GhostConfigProvider } from 'core/config/config-loader'
import { AuthRole, AuthUser, BasicAuthUser, ExternalAuthUser, Workspace } from 'core/misc/interfaces'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import { GhostService } from './ghost/service'

@injectable()
export class WorkspaceService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'WorkspaceService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: GhostConfigProvider
  ) {}

  async getWorkspace(): Promise<Workspace> {
    try {
      const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
      if (workspaces && workspaces.length) {
        return workspaces[0]
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Couldn't read file workspaces.json`)
      }
    }

    return this.getDefaultWorkspace()
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

  async findUser(where: {}, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    const workspace = await this.getWorkspace()
    const user = _.head(_.filter(workspace.users, where))
    // return selectFields ? _.pick(user, selectFields) : user
    return user
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
      role: workspace.defaultRole,
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
    const workspace = await this.getWorkspace()
    const original = await this.findUser({ email })
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
    const workspace = await this.getWorkspace()
    const index = _.findIndex(workspace.users, x => x.email === email)

    if (index > -1) {
      workspace.users.splice(index, 1)
      await this.save(workspace)
    }
  }

  getDefaultWorkspace() {
    return {
      name: 'Default',
      userSeq: 0,
      users: [],
      bots: [],
      roles: defaultRoles,
      defaultRole: defaultUserRole,
      adminRole: defaultAdminRole
    }
  }
}
