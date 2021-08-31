import { IO } from 'botpress/sdk'
import LicensingService from 'common/licensing-service'
import { BotMonitoringService, BotService } from 'core/bots'
import { GhostContainerModule } from 'core/bpfs'
import { CMSService, RenderService } from 'core/cms'
import { ConverseService } from 'core/converse'
import { DialogContainerModule, SkillService } from 'core/dialog'
import { CEJobService, JobService } from 'core/distributed'
import { EventEngine, Queue, MemoryQueue } from 'core/events'
import { CEMonitoringService, MonitoringService, AlertingService, CEAlertingService } from 'core/health'
import { KeyValueStore } from 'core/kvs'
import { LogsJanitor } from 'core/logger'
import { MediaServiceProvider } from 'core/media'
import { MessagingService } from 'core/messaging'
import { QnaService } from 'core/qna'
import { RealtimeService } from 'core/realtime'
import { AuthService, AuthStrategies, CEAuthStrategies } from 'core/security'
import { StatsService } from 'core/telemetry'
import { HookService, ActionService, ActionServersService, HintsService } from 'core/user-code'
import { ContainerModule, interfaces } from 'inversify'

import CELicensingService from '../../services/licensing'
import { NLUService } from '../../services/nlu/nlu-service'
import { TYPES } from '../types'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()

  bind<NLUService>(TYPES.NLUService)
    .to(NLUService)
    .inSingletonScope()

  bind<MediaServiceProvider>(TYPES.MediaServiceProvider)
    .to(MediaServiceProvider)
    .inSingletonScope()

  bind<ActionService>(TYPES.ActionService)
    .to(ActionService)
    .inSingletonScope()

  bind<ActionServersService>(TYPES.ActionServersService)
    .to(ActionServersService)
    .inSingletonScope()

  bind<LicensingService>(TYPES.LicensingService)
    .to(CELicensingService)
    .inSingletonScope()
    .when(() => !process.IS_PRO_ENABLED)

  bind<JobService>(TYPES.JobService)
    .to(CEJobService)
    .inSingletonScope()
    .when(() => !process.IS_PRODUCTION || !process.CLUSTER_ENABLED || !process.IS_PRO_ENABLED)

  bind<MonitoringService>(TYPES.MonitoringService)
    .to(CEMonitoringService)
    .inSingletonScope()
    .when(() => !process.CLUSTER_ENABLED || !process.IS_PRO_ENABLED)

  bind<AlertingService>(TYPES.AlertingService)
    .to(CEAlertingService)
    .inSingletonScope()
    .when(() => !process.CLUSTER_ENABLED || !process.IS_PRO_ENABLED)

  bind<BotMonitoringService>(TYPES.BotMonitoringService)
    .to(BotMonitoringService)
    .inSingletonScope()

  bind<AuthStrategies>(TYPES.AuthStrategies)
    .to(CEAuthStrategies)
    .inSingletonScope()
    .when(() => !process.IS_PRO_ENABLED)

  bind<Queue<IO.IncomingEvent>>(TYPES.IncomingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Incoming', context.container.getTagged(TYPES.Logger, 'name', 'IQueue'))
  })

  bind<Queue<IO.OutgoingEvent>>(TYPES.OutgoingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Outgoing', context.container.getTagged(TYPES.Logger, 'name', 'OQueue'))
  })

  bind<HookService>(TYPES.HookService)
    .to(HookService)
    .inSingletonScope()

  bind<HintsService>(TYPES.HintsService)
    .to(HintsService)
    .inSingletonScope()

  bind<EventEngine>(TYPES.EventEngine)
    .to(EventEngine)
    .inSingletonScope()

  bind<RealtimeService>(TYPES.RealtimeService)
    .to(RealtimeService)
    .inSingletonScope()

  bind<AuthService>(TYPES.AuthService)
    .to(AuthService)
    .inSingletonScope()

  bind<LogsJanitor>(TYPES.LogJanitorRunner)
    .to(LogsJanitor)
    .inSingletonScope()

  bind<KeyValueStore>(TYPES.KeyValueStore)
    .to(KeyValueStore)
    .inSingletonScope()

  bind<SkillService>(TYPES.SkillService)
    .to(SkillService)
    .inSingletonScope()

  bind<ConverseService>(TYPES.ConverseService)
    .to(ConverseService)
    .inSingletonScope()

  bind<BotService>(TYPES.BotService)
    .to(BotService)
    .inSingletonScope()

  bind<StatsService>(TYPES.StatsService)
    .to(StatsService)
    .inSingletonScope()

  bind<RenderService>(TYPES.RenderService)
    .to(RenderService)
    .inSingletonScope()

  bind<QnaService>(TYPES.QnaService)
    .to(QnaService)
    .inSingletonScope()

  bind<MessagingService>(TYPES.MessagingService)
    .to(MessagingService)
    .inSingletonScope()
})

export const ServicesContainerModules = [ServicesContainerModule, DialogContainerModule, GhostContainerModule]
