import { ObjectCache } from 'common/object-cache'
import { TYPES } from 'core/app/types'
import { ContainerModule, interfaces } from 'inversify'

import { CacheInvalidators } from '.'
import { DBStorageDriver } from './drivers/db-driver'
import { DiskStorageDriver } from './drivers/disk-driver'
import { GhostService } from './ghost-service'
import { MemoryObjectCache } from './memory-cache'

export const GhostContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CacheInvalidators.FileChangedInvalidator>(TYPES.FileCacheInvalidator)
    .to(CacheInvalidators.FileChangedInvalidator)
    .inSingletonScope()

  bind<ObjectCache>(TYPES.ObjectCache)
    .to(MemoryObjectCache)
    .inSingletonScope()
    .when(() => !process.CLUSTER_ENABLED || !process.IS_PRO_ENABLED)

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
