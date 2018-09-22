import { ExtendedKnex } from 'botpress-module-sdk'
import { ContainerModule, interfaces } from 'inversify'
import Knex from 'knex'

import { TYPES } from '../misc/types'

import Database from '.'
import { patchKnex } from './helpers'

export const DatabaseContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<Database>(TYPES.Database)
    .to(Database)
    .inSingletonScope()

  bind<ExtendedKnex>(TYPES.InMemoryDatabase).toDynamicValue(() => {
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
