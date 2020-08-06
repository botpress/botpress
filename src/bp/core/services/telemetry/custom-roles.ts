import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { GhostService } from '..'
import { JobService } from '../job-service'

import { TelemetryStats } from './telemetry-stats'

const DEFAULT_ROLES = ['dev', 'admin', 'editor']
@injectable()
export class RolesStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-custom-roles'
    this.interval = ms('1d')
  }

  protected async getStats() {
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'custom_roles',
      event_data: { schema: '1.0.0', roles: await this.getRoles() }
    }
  }

  private async getRoles() {
    const workspaces = await this.getWorkspaceConfig()

    return workspaces.reduce((acc, workspace) => {
      const roles = workspace.roles.map(role => ({
        id: _.includes(DEFAULT_ROLES, role.id) ? role.id : calculateHash(role.id),
        rules: role.rules
      }))
      return [...acc, { id: calculateHash(workspace.id), roles }]
    }, [])
  }

  private async getWorkspaceConfig() {
    try {
      return (await this.ghostService.global().readFileAsObject('/', 'workspaces.json')) as any[]
    } catch (error) {
      return []
    }
  }
}
