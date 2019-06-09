import LicensingService from 'common/licensing-service'
import { DialogContainerModule } from 'core/services/dialog/dialog.inversify'
import { CEJobService, JobService } from 'core/services/job-service'
import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../types'

import ActionService from './action/action-service'
import { AlertingService, CEAlertingService } from './alerting-service'
import { AuthStrategies, CEAuthStrategies } from './auth-strategies'
import AuthService from './auth/auth-service'
import { BotService } from './bot-service'
import { CMSService } from './cms'
import { ConverseService } from './converse'
import { SkillService } from './dialog/skill/service'
import { GhostContainerModule } from './ghost/ghost.inversify'
import { HintsService } from './hints'
import { HookService } from './hook/hook-service'
import { KeyValueStore } from './kvs'
import CELicensingService from './licensing'
import { LogsJanitor } from './logs/janitor'
import { LogsService } from './logs/service'
import MediaService from './media'
import { EventEngine } from './middleware/event-engine'
import { CEMonitoringService, MonitoringService } from './monitoring'
import { NotificationsService } from './notification/service'
import { Queue } from './queue'
import MemoryQueue from './queue/memory-queue'
import RealtimeService from './realtime'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()

  bind<MediaService>(TYPES.MediaService)
    .to(MediaService)
    .inSingletonScope()

  bind<ActionService>(TYPES.ActionService)
    .to(ActionService)
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

  bind<AuthStrategies>(TYPES.AuthStrategies)
    .to(CEAuthStrategies)
    .inSingletonScope()
    .when(() => !process.IS_PRO_ENABLED)

  bind<Queue>(TYPES.IncomingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Incoming', context.container.getTagged(TYPES.Logger, 'name', 'IQueue'))
  })

  bind<Queue>(TYPES.OutgoingQueue).toDynamicValue((context: interfaces.Context) => {
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

  bind<LogsService>(TYPES.LogsService)
    .to(LogsService)
    .inSingletonScope()

  bind<NotificationsService>(TYPES.NotificationsService)
    .to(NotificationsService)
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
})

export const ServicesContainerModules = [ServicesContainerModule, DialogContainerModule, GhostContainerModule]
