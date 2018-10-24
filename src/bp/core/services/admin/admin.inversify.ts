import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'
import { AdminService, EnterpriseAdminService, ProfessionnalAdminService } from 'professional/services/admin'

import { CommunityAdminService } from './community'

export const AdminContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<AdminService>(TYPES.AdminService)
    .to(CommunityAdminService)
    .inSingletonScope()
    .when(request => isExpectedEdition('community', request.parentContext))

  bind<AdminService>(TYPES.AdminService)
    .to(ProfessionnalAdminService)
    .inSingletonScope()
    .when(request => isExpectedEdition('professional', request.parentContext))

  bind<AdminService>(TYPES.AdminService)
    .to(EnterpriseAdminService)
    .inSingletonScope()
    .when(request => isExpectedEdition('enterprise', request.parentContext))
})

function isExpectedEdition(expected: string, context: interfaces.Context) {
  const edition = context.container.get<string>(TYPES.BotpressEdition)
  return edition === expected
}
