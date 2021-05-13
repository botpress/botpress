import { StrategyUser } from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

@injectable()
export class StrategyUsersRepository {
  constructor(@inject(TYPES.Database) private database: Database) {}

  private _getTableName(strategy) {
    return `strategy_${strategy}`
  }

  async getAttributes(email: string, strategy: string): Promise<any> {
    const user = await this.database
      .knex(this._getTableName(strategy))
      .where({ strategy })
      .andWhere(this.database.knex.raw('LOWER(email) = ?', [email.toLowerCase()]))
      .limit(1)
      .select('attributes')
      .first()

    return this.database.knex.json.get(user.attributes)
  }

  async findUser(email: string, strategy: string): Promise<StrategyUser | undefined> {
    if (!email || !strategy) {
      throw new Error('Email and Strategy are mandatory')
    }

    return this.database
      .knex(this._getTableName(strategy))
      .select('*')
      .where({ strategy })
      .andWhere(this.database.knex.raw('LOWER(email) = ?', [email.toLowerCase()]))
      .limit(1)
      .first()
      .then(res => {
        return res && { ...res, attributes: this.database.knex.json.get(res.attributes) }
      })
  }
}
