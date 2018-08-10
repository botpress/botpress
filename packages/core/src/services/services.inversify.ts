import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { CMSService } from './cms/cms-service'
import FlowService from './dialog/flow-service'
import { ObjectCache, StorageDriver } from './ghost'
import DiskStorageDriver from './ghost/disk-driver'
import GhostService from './ghost/impl'
import MemoryObjectCache from './ghost/memory-cache'
import { MiddlewareService } from './middleware/middleware-service'

export const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<MiddlewareService>(TYPES.MiddlewareService).to(MiddlewareService)

  bind<ObjectCache>('ObjectCache').to(MemoryObjectCache)
  bind<StorageDriver>('StorageDriver').to(DiskStorageDriver)

  bind<GhostService>(TYPES.GhostService)
    .to(GhostService)
    .inSingletonScope()

  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()

  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()
})
