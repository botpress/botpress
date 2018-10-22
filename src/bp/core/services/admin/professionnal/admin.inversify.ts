import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { CommunityAdminService } from '../community'

import { AdminService } from './admin-service'
import { EnterpriseAdminService } from './enterprise'
import { ProfessionnalAdminService } from './profesionnal'

export const AdminContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<AdminService>(TYPES.AdminService)
    .to(CommunityAdminService)
    .inSingletonScope()
    .when(request => isExpectedEdition('community', request.parentContext))

  bind<AdminService>(TYPES.AdminService)
    .to(ProfessionnalAdminService)
    .inSingletonScope()
    .when(request => isExpectedEdition('professionnal', request.parentContext))

  bind<AdminService>(TYPES.AdminService)
    .to(EnterpriseAdminService)
    .inSingletonScope()
    .when(request => isExpectedEdition('enterprise', request.parentContext))
})

function isExpectedEdition(expected: string, context: interfaces.Context) {
  const edition = context.container.get<string>(TYPES.BotpressEdition)
  return edition === expected
}
