import { StrategyUsersRepository, WorkspaceUsersRepository } from 'core/users'
import { ContainerModule, interfaces } from 'inversify'
import { TYPES } from '../types'

const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<StrategyUsersRepository>(TYPES.StrategyUsersRepository)
    .to(StrategyUsersRepository)
    .inSingletonScope()

  bind<WorkspaceUsersRepository>(TYPES.WorkspaceUsersRepository)
    .to(WorkspaceUsersRepository)
    .inSingletonScope()
})

export const RepositoriesContainerModules = [RepositoriesContainerModule]
