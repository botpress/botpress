import { BotConfig, Logger } from 'botpress/sdk'
import { AuthRole, AuthUser, BasicAuthUser, Workspace } from 'core/misc/interfaces'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import defaultRoles from './admin/default-roles'
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

  async save() {
    const workspaces = [this._workspace]
    this.ghost.global().upsertFile('/', `workspaces.json`, JSON.stringify(workspaces, undefined, 2))
  }

  addBotRef(botId: string): void {
    this._workspace.bots.push(botId)
  }

  deleteBotRef(botId: any): void {
    const index = this._workspace.bots.findIndex(botId)
    this._workspace.bots.splice(index, 1)
  }

  getBotRefs(): string[] {
    return this._workspace.bots
  }

  listUsers(selectFields?: Array<keyof AuthUser>): Partial<AuthUser[]> {
    if (!selectFields) {
      return this._workspace.users
    } else {
      return _.map(this._workspace.users, x => _.pick(x, selectFields))
    }
  }

  assertUserExists(userId: string): void {
    const user = this.findUser({ id: userId })
    if (!user) {
      throw new Error(`User "${userId}" is not a part of the workspace "${this._workspace.name}"`)
    }
  }

  async assertIsRootAdmin(userId: number) {
    if (userId !== this.ROOT_ADMIN_ID) {
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

  getRoleForUser(userId): AuthRole {
    const user = this.findUser({ id: userId })!
    return this.findRole(user.role!)
  }

  async createUser(authUser: BasicAuthUser): Promise<AuthUser> {
    const newUser: AuthUser = {
      ...authUser,
      id: ++this._workspace.userSeq
    }

    this._workspace.users.push(newUser)
    await this.save()

    return newUser
  }

  async updateUser(userId: number, userData: Partial<AuthUser>) {
    const original = this.findUser({ id: userId })
    if (!original) {
      throw Error('Cannot find user')
    }

    const newUser: AuthUser = {
      ...original,
      ...userData
    }
    const idx = _.findIndex(this._workspace!.users, x => x.id === userId)
    this._workspace.users.splice(idx, 1, newUser)

    await this.save()
  }

  async deleteUser(userId: number) {
    const index = _.findIndex(this._workspace.users, x => x.id === userId)

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
      roles: defaultRoles
    }
  }
}
