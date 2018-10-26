import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject } from 'inversify'

export interface AuthRolesRepository {
  insertRoles(roles)
}

export class KnexAuthRolesRepository implements AuthRolesRepository {
  private readonly tableName = 'auth_roles'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async insertRoles(roles): Promise<void> {
    await this.database.knex.batchInsert(
      this.tableName,
      roles.map((role, index) => {
        return { ...role, id: index + 1, team: 1, rules: JSON.stringify(role.rules) }
      })
    )
  }
}
