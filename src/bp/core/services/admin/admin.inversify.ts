import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { CommunityAdminService } from './community'
import { AdminService } from './service'

export const AdminContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<AdminService>(TYPES.AdminService)
    .to(CommunityAdminService)
    .inSingletonScope()
    .when(() => process.BOTPRESS_EDITION === 'ce')
})
