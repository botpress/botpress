import { Logger } from 'botpress/sdk'
import { AuthRole, AuthUser, BasicAuthUser, ExternalAuthUser, Workspace } from 'core/misc/interfaces'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import { defaultRole, defaultRoles } from './admin/default-roles'
import { UnauthorizedAccessError } from './auth/errors'
import { GhostService } from './ghost/service'

@injectable()
export class WorkspaceService {
  protected ROOT_ADMIN_ID = 1 // FIXME: UserIds will disapear to favor email address. Use a flag instead.

  private _workspace!: Workspace

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'WorkspaceService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  async initialize(): Promise<void> {
    try {
      const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
      this._workspace = workspaces[0]
    } catch (error) {
      if (error.code === 'ENOENT') {
        this._workspace = this.getDefaultWorkspace()
      } else {
        this.logger.attachError(error).error(`Error loading workspace`)
      }
    }
  }

  // TODO: get by name or ID
  getWorkspace(): Workspace {
    return this._workspace
  }

  async save() {
    const workspaces = [this._workspace]
    await this.ghost.global().upsertFile('/', `workspaces.json`, JSON.stringify(workspaces, undefined, 2))
  }

  async addBotRef(botId: string): Promise<void> {
    this._workspace.bots.push(botId)
    await this.save()
  }

  async deleteBotRef(botId: any): Promise<void> {
    const index = this._workspace.bots.findIndex(x => x === botId)
    this._workspace.bots.splice(index, 1)
    await this.save()
  }

  getBotRefs(): string[] {
    return this._workspace.bots
  }

  listUsers(selectFields?: Array<keyof AuthUser>): Partial<AuthUser[]> {
    if (!selectFields) {
      return this._workspace && this._workspace.users
    } else {
      return _.map(this._workspace.users, x => _.pick(x, selectFields))
    }
  }

  assertUserExists(email: string): void {
    const user = this.findUser({ email })
    if (!user) {
      throw new Error(`User "${email}" is not a part of the workspace "${this._workspace.name}"`)
    }
  }

  async assertIsRootAdmin(role: string) {
    if (this._workspace.roles.find(r => r.id === 'admin') && role !== 'admin') {
      throw new UnauthorizedAccessError(`Only root admin is allowed to use this`)
    }
  }

  findUser(where: {}, selectFields?: Array<keyof AuthUser>): AuthUser | undefined {
    const user = _.head(_.filter(this._workspace.users, where))
    // return selectFields ? _.pick(user, selectFields) : user
    return user
  }

  findRole(name: string): AuthRole {
    const role = this._workspace.roles.find(r => r.name === name)
    if (!role) {
      throw new Error(`Role "${name}" does not exists in workspace "${this._workspace.name}"`)
    }
    return role
  }

  getRoleForUser(email: string): AuthRole {
    const user = this.findUser({ email })!
    return this.findRole(user.role!)
  }

  async createUser(authUser: BasicAuthUser | ExternalAuthUser): Promise<AuthUser> {
    const newUser: AuthUser = {
      ...authUser,
      created_on: new Date()
    }

    // If there's no users, make the first account's role as Admin
    if (!this._workspace.users.length) {
      newUser.role = 'admin'
    }

    this._workspace.users.push(newUser)
    await this.save()

    return newUser
  }

  async updateUser(email: string, userData: Partial<AuthUser>) {
    const original = this.findUser({ email })
    if (!original) {
      throw Error('Cannot find user')
    }

    const newUser: AuthUser = {
      ...original,
      ...userData
    }
    const idx = _.findIndex(this._workspace!.users, x => x.email === email)
    this._workspace.users.splice(idx, 1, newUser)

    await this.save()
  }

  async deleteUser(email: string) {
    const index = _.findIndex(this._workspace.users, x => x.email === email)

    if (index > -1) {
      this._workspace.users.splice(index, 1)
      await this.save()
    }
  }

  getDefaultWorkspace() {
    return {
      name: 'Default',
      userSeq: 0,
      users: [],
      bots: [],
      roles: defaultRoles,
      defaultRole: defaultRole
    }
  }
}
