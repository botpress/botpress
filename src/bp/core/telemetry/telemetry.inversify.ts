import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { ActionsStats } from './stats/actions'
import { ConfigsStats } from './stats/configs'
import { HooksLifecycleStats } from './stats/hooks'
import { LegacyStats } from './stats/legacy-stats'
import { RolesStats } from './stats/roles-stats'
import { SDKStats } from './stats/sdk-methods'

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

  bind<HooksLifecycleStats>(TYPES.HooksStats)
    .to(HooksLifecycleStats)
    .inSingletonScope()

  bind<ConfigsStats>(TYPES.ConfigsStats)
    .to(ConfigsStats)
    .inSingletonScope()
})

export const TelemetryContainerModules = [ServicesContainerModule]
