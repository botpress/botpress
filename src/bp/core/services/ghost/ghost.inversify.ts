import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { GhostService } from '..'

import { CacheInvalidators, ObjectCache } from '.'
import DBStorageDriver from './db-driver'
import DiskStorageDriver from './disk-driver'
import MemoryObjectCache from './memory-cache'

export const GhostContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CacheInvalidators.FileChangedInvalidator>(TYPES.FileCacheInvalidator)
    .to(CacheInvalidators.FileChangedInvalidator)
    .inSingletonScope()

  bind<ObjectCache>(TYPES.ObjectCache)
    .to(MemoryObjectCache)
    .inSingletonScope()

  bind<DiskStorageDriver>(TYPES.DiskStorageDriver)
    .to(DiskStorageDriver)
    .inSingletonScope()

  bind<DBStorageDriver>(TYPES.DBStorageDriver)
    .to(DBStorageDriver)
    .inSingletonScope()

  bind<GhostService>(TYPES.GhostService)
    .to(GhostService)
    .inSingletonScope()
})
