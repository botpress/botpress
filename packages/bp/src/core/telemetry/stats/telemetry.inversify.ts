import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { ActionsStats } from './actions-stats'
import { ConfigsStats } from './configs-stats'
import { HooksStats } from './hooks-stats'
import { LegacyStats } from './legacy-stats'
import { MessageStats } from './message-stats'
import { RolesStats } from './roles-stats'
import { SDKStats } from './sdk-stats'
import { UserStats } from './user-stats'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<ActionsStats>(TYPES.ActionStats)
    .to(ActionsStats)
    .inSingletonScope()

  bind<LegacyStats>(TYPES.LegacyStats)
    .to(LegacyStats)
    .inSingletonScope()

  bind<RolesStats>(TYPES.RolesStats)
    .to(RolesStats)
    .inSingletonScope()

  bind<SDKStats>(TYPES.SDKStats)
    .to(SDKStats)
    .inSingletonScope()

  bind<HooksStats>(TYPES.HooksStats)
    .to(HooksStats)
    .inSingletonScope()

  bind<ConfigsStats>(TYPES.ConfigsStats)
    .to(ConfigsStats)
    .inSingletonScope()

  bind<UserStats>(TYPES.UserStats)
    .to(UserStats)
    .inSingletonScope()

  bind<MessageStats>(TYPES.MessageStats)
    .to(MessageStats)
    .inSingletonScope()
})

export const TelemetryContainerModules = [ServicesContainerModule]
