import { IO } from 'botpress/runtime-sdk'
import { ContainerModule, interfaces } from 'inversify'
import { BotMonitoringService, BotService } from 'runtime/bots'
import { GhostContainerModule } from 'runtime/bpfs'
import { CMSService, RenderService } from 'runtime/cms'
import { ConverseService } from 'runtime/converse'
import { DialogContainerModule } from 'runtime/dialog'
import { LocalJobService, JobService, RedisJobService } from 'runtime/distributed'
import { EventEngine, Queue, MemoryQueue } from 'runtime/events'
import { KeyValueStore } from 'runtime/kvs'
import { LogsJanitor } from 'runtime/logger'
import { MessagingService } from 'runtime/messaging'
import { NLUInferenceService } from 'runtime/nlu'
import { QnaService } from 'runtime/qna'

import { HookService, ActionService } from 'runtime/user-code'
import { DataRetentionService } from 'runtime/users/data-retention/data-retention-service'

import { TYPES } from '../types'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()

  bind<ActionService>(TYPES.ActionService)
    .to(ActionService)
    .inSingletonScope()

  bind<ConverseService>(TYPES.ConverseService)
    .to(ConverseService)
    .inSingletonScope()

  bind<BotMonitoringService>(TYPES.BotMonitoringService)
    .to(BotMonitoringService)
    .inSingletonScope()

  bind<MessagingService>(TYPES.MessagingService)
    .to(MessagingService)
    .inSingletonScope()

  bind<Queue<IO.IncomingEvent>>(TYPES.IncomingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Incoming', context.container.getTagged(TYPES.Logger, 'name', 'IQueue'))
  })

  bind<Queue<IO.OutgoingEvent>>(TYPES.OutgoingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Outgoing', context.container.getTagged(TYPES.Logger, 'name', 'OQueue'))
  })

  bind<JobService>(TYPES.JobService)
    .to(LocalJobService)
    .inSingletonScope()
    .when(() => !process.CLUSTER_ENABLED)

  bind<JobService>(TYPES.JobService)
    .to(RedisJobService)
    .inSingletonScope()
    .when(() => process.CLUSTER_ENABLED)

  bind<HookService>(TYPES.HookService)
    .to(HookService)
    .inSingletonScope()

  bind<EventEngine>(TYPES.EventEngine)
    .to(EventEngine)
    .inSingletonScope()

  bind<LogsJanitor>(TYPES.LogJanitorRunner)
    .to(LogsJanitor)
    .inSingletonScope()

  bind<KeyValueStore>(TYPES.KeyValueStore)
    .to(KeyValueStore)
    .inSingletonScope()

  bind<BotService>(TYPES.BotService)
    .to(BotService)
    .inSingletonScope()

  bind<RenderService>(TYPES.RenderService)
    .to(RenderService)
    .inSingletonScope()

  bind<QnaService>(TYPES.QnaService)
    .to(QnaService)
    .inSingletonScope()

  bind<DataRetentionService>(TYPES.DataRetentionService)
    .to(DataRetentionService)
    .inSingletonScope()

  bind<NLUInferenceService>(TYPES.NLUInferenceService)
    .to(NLUInferenceService)
    .inSingletonScope()
})

export const ServicesContainerModules = [ServicesContainerModule, DialogContainerModule, GhostContainerModule]
