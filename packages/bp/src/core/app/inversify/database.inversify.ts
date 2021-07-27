import Database from 'core/database'
import { patchKnex } from 'core/database/helpers'
import { ContainerModule, interfaces } from 'inversify'
import Knex from 'knex'

import { TYPES } from '../types'

const DatabaseContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<Database>(TYPES.Database)
    .to(Database)
    .inSingletonScope()

  bind<Knex>(TYPES.InMemoryDatabase).toDynamicValue(() => {
    return patchKnex(
      Knex({
        client: 'sqlite3',
        connection: ':memory:',
        pool: { min: 1, max: 1, idleTimeoutMillis: 360000 * 1000 },
        useNullAsDefault: true
      })
    )
  })
})

export const DatabaseContainerModules = [DatabaseContainerModule]
