import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { CommunityTeamsService } from './community'
import { EnterpriseTeamsService } from './enterprise'
import { ProfessionnalTeamsService } from './profesionnal'
import BaseTeamsService, { TeamsServiceFacade } from './teams-service'

export const AuthContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<BaseTeamsService>(TYPES.BaseTeamsService)
    .to(BaseTeamsService)
    .inSingletonScope()

  bind<TeamsServiceFacade>(TYPES.TeamsServiceFacade)
    .to(CommunityTeamsService)
    .inSingletonScope()
    .when(request => isExpectedEdition('community', request.parentContext))

  bind<TeamsServiceFacade>(TYPES.TeamsServiceFacade)
    .to(ProfessionnalTeamsService)
    .inSingletonScope()
    .when(request => isExpectedEdition('professionnal', request.parentContext))

  bind<TeamsServiceFacade>(TYPES.TeamsServiceFacade)
    .to(EnterpriseTeamsService)
    .inSingletonScope()
    .when(request => isExpectedEdition('enterprise', request.parentContext))
})

function isExpectedEdition(expected: string, context: interfaces.Context) {
  const edition = context.container.get<string>(TYPES.BotpressEdition)
  return edition === expected
}
