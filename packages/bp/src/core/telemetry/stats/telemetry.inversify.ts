import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { ConfigsStats } from './configs-stats'
import { LegacyStats } from './legacy-stats'
import { RolesStats } from './roles-stats'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<LegacyStats>(TYPES.LegacyStats)
    .to(LegacyStats)
    .inSingletonScope()

  bind<RolesStats>(TYPES.RolesStats)
    .to(RolesStats)
    .inSingletonScope()

  bind<ConfigsStats>(TYPES.ConfigsStats)
    .to(ConfigsStats)
    .inSingletonScope()
})

export const TelemetryContainerModules = [ServicesContainerModule]
