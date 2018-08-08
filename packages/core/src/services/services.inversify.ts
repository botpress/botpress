import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { CMSService } from './cms/cms-service'
import FlowService from './dialog/flow-service'
import { GhostContentService } from './ghost-content'
import FSGhostContentService from './ghost-content/file-system'
import { MiddlewareService } from './middleware/middleware-service'

export const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<MiddlewareService>(TYPES.MiddlewareService).to(MiddlewareService)

  bind<GhostContentService>(TYPES.GhostService)
    .to(FSGhostContentService)
    .inSingletonScope()

  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()

  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()
})
