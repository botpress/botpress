import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { CMSService } from './cms'
import { GhostCMSService } from './cms/ghost-cms-service'
import { FlowProvider } from './dialog'
import GhostFlowProvider from './dialog/ghost-flow-provider'
import { GhostContentService } from './ghost-content'
import FSGhostContentService from './ghost-content/file-system'
import { MiddlewareService } from './middleware/middleware-service'

export const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<MiddlewareService>(TYPES.MiddlewareService).to(MiddlewareService)

  bind<FlowProvider>(TYPES.FlowProvider)
    .to(GhostFlowProvider)
    .inSingletonScope()

  bind<GhostContentService>(TYPES.GhostService)
    .to(FSGhostContentService)
    .inSingletonScope()

  bind<CMSService>(TYPES.CMSService)
    .to(GhostCMSService)
    .inSingletonScope()
})
