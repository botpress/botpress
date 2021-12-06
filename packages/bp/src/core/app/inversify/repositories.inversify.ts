import { LogsRepository } from 'core/logger'
import { TelemetryRepository } from 'core/telemetry'
import {
  ChannelUserRepository,
  StrategyUsersRepository,
  WorkspaceInviteCodesRepository,
  WorkspaceUsersRepository
} from 'core/users'
import { ContainerModule, interfaces } from 'inversify'
import { TYPES } from '../types'

const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<ChannelUserRepository>(TYPES.UserRepository)
    .to(ChannelUserRepository)
    .inSingletonScope()

  bind<LogsRepository>(TYPES.LogsRepository)
    .to(LogsRepository)
    .inSingletonScope()

  bind<StrategyUsersRepository>(TYPES.StrategyUsersRepository)
    .to(StrategyUsersRepository)
    .inSingletonScope()

  bind<TelemetryRepository>(TYPES.TelemetryRepository)
    .to(TelemetryRepository)
    .inSingletonScope()

  bind<WorkspaceUsersRepository>(TYPES.WorkspaceUsersRepository)
    .to(WorkspaceUsersRepository)
    .inSingletonScope()

  bind<WorkspaceInviteCodesRepository>(TYPES.WorkspaceInviteCodesRepository)
    .to(WorkspaceInviteCodesRepository)
    .inSingletonScope()
})

export const RepositoriesContainerModules = [RepositoriesContainerModule]
