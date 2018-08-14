import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import ActionService from './action'
import { CMSService } from './cms/cms-service'
import FlowService from './dialog/flow-service'
import { ObjectCache, StorageDriver } from './ghost'
import DiskStorageDriver from './ghost/disk-driver'
import MemoryObjectCache from './ghost/memory-cache'
import GhostService from './ghost/service'
import { HookService } from './hook/hook-service'
import { MiddlewareService } from './middleware/middleware-service'
import { Queue } from './queue'
import MemoryQueue from './queue/memory-queue'

export const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<MiddlewareService>(TYPES.MiddlewareService).to(MiddlewareService)

  bind<ObjectCache>(TYPES.ObjectCache).to(MemoryObjectCache)
  bind<StorageDriver>(TYPES.StorageDriver).to(DiskStorageDriver)

  bind<GhostService>(TYPES.GhostService)
    .to(GhostService)
    .inSingletonScope()

  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()

  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()

  bind<ActionService>(TYPES.ActionService)
    .to(ActionService)
    .inSingletonScope()

  bind<Queue>(TYPES.Queue)
    .to(MemoryQueue)
    .inSingletonScope()

  bind<HookService>(TYPES.HookService)
    .to(HookService)
    .inSingletonScope()
})
