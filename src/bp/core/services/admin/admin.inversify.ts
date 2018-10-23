import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { CommunityAdminService } from './community'

import { AdminService } from './professional/admin-service'
import { EnterpriseAdminService } from './professional/enterprise'
import { ProfessionnalAdminService } from './professional/profesionnal'

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
