import LicensingService from 'common/licensing-service'
import { BotService } from 'core/bots'
import { GhostContainerModule } from 'core/bpfs'
import { CMSService, RenderService } from 'core/cms'
import { DialogContainerModule, SkillService } from 'core/dialog'
import { CEJobService, JobService } from 'core/distributed'
import { EventEngine } from 'core/events'
import { CEMonitoringService, MonitoringService, AlertingService, CEAlertingService } from 'core/health'
import { KeyValueStore } from 'core/kvs'
import { LogsJanitor } from 'core/logger'
import { MediaServiceProvider } from 'core/media'
import { QnaService } from 'core/qna'
import { RealtimeService } from 'core/realtime'
import { AuthService, AuthStrategies, CEAuthStrategies } from 'core/security'
import { StatsService } from 'core/telemetry'
import { HookService, ActionService, ActionServersService } from 'core/user-code'
import { ContainerModule, interfaces } from 'inversify'

import CELicensingService from '../../services/licensing'
import { TYPES } from '../types'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
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

  bind<AuthStrategies>(TYPES.AuthStrategies)
    .to(CEAuthStrategies)
    .inSingletonScope()
    .when(() => !process.IS_PRO_ENABLED)

  bind<HookService>(TYPES.HookService)
    .to(HookService)
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
})

export const ServicesContainerModules = [ServicesContainerModule, DialogContainerModule, GhostContainerModule]
