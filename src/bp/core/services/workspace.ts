import { Logger } from 'botpress/sdk'
import { AuthUser, Workspace } from 'core/misc/interfaces'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import { GhostService } from './ghost/service'

@injectable()
export class WorkspaceService {
  private _workspace!: Workspace

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'WorkspaceService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {
    this.loadAll()
  }

  async loadAll(): Promise<void> {
    const workspaces = await this.ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
    this._workspace = workspaces[0]
  }

  async save() {
    const workspaces = [{ ...this._workspace, name: 'default' }]
    this.ghost.global().upsertFile('/', `workspaces.json`, JSON.stringify(workspaces, undefined, 2))
  }

  listUsers(selectFields?: Array<keyof AuthUser>): Partial<AuthUser[]> {
    if (!selectFields) {
      return this._workspace.users
    } else {
      return _.map(this._workspace.users, x => _.pick(x, selectFields))
    }
  }

  findUser(where: {}, selectFields?: Array<keyof AuthUser>): AuthUser | undefined {
    const user = _.head(_.filter(this._workspace.users, where))
    // return selectFields ? _.pick(user, selectFields) : user
    return user
  }

  async createUser(authUser: AuthUser): Promise<number> {
    const highestId = _.max(_.map(this._workspace.users, 'id')) || 0

    const newUser: AuthUser = {
      ...authUser,
      id: highestId + 1
    }

    const newList: AuthUser[] = [...this._workspace.users, newUser]

    this._workspace.users = newList
    await this.save()
    return newUser.id
  }

  async updateUser(userId: number, userData: Partial<AuthUser>) {
    const original = await this.findUser({ id: userId })
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
}
