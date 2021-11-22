import { ContainerModule, interfaces } from 'inversify'
import { SessionRepository } from 'runtime/dialog/sessions'
import { EventRepository } from 'runtime/events'
import { LogsRepository } from 'runtime/logger'
import { TasksRepository } from 'runtime/user-code/action-server/tasks-repository'

import { ChannelUserRepository } from 'runtime/users'
import { TYPES } from '../types'

const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<SessionRepository>(TYPES.SessionRepository)
    .to(SessionRepository)
    .inSingletonScope()

  bind<ChannelUserRepository>(TYPES.UserRepository)
    .to(ChannelUserRepository)
    .inSingletonScope()

  bind<LogsRepository>(TYPES.LogsRepository)
    .to(LogsRepository)
    .inSingletonScope()

  bind<EventRepository>(TYPES.EventRepository)
    .to(EventRepository)
    .inSingletonScope()

  bind<TasksRepository>(TYPES.TasksRepository)
    .to(TasksRepository)
    .inSingletonScope()
})

export const RepositoriesContainerModules = [RepositoriesContainerModule]
