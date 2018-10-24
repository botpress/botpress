import { Logger } from 'botpress/sdk'
import { BotLoader } from 'core/bot-loader'
import { BotConfigFactory, BotConfigWriter } from 'core/config'
import Database from 'core/database'
import { AuthRole, AuthRule, Bot } from 'core/misc/interfaces'
import { ModuleLoader } from 'core/module-loader'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

import { GhostService } from '../..'
import { FeatureNotAvailableError } from '../errors'

import CoreAdminService, { AdminService } from './admin-service'

@injectable()
export class ProfessionnalAdminService implements AdminService {
  private adminService!: CoreAdminService

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.BotConfigFactory) private botConfigFactory: BotConfigFactory,
    @inject(TYPES.BotConfigWriter) private botConfigWriter: BotConfigWriter,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.BotpressEdition) private edition: string
  ) {
    this.adminService = new CoreAdminService(
      this.logger,
      this.database,
      this.botConfigFactory,
      this.botConfigWriter,
      this.botLoader,
      this.ghostService,
      this.moduleLoader
    )
  }

  async addMemberToTeam(userId: number, teamId: number, roleName: string) {
    await this.adminService.addMemberToTeam(userId, teamId, roleName)
  }

  async removeMemberFromTeam(userId: any, teamId: any) {
    await this.adminService.removeMemberFromTeam(userId, teamId)
  }

  async listUserTeams(userId: number) {
    return this.adminService.listUserTeams(userId)
  }

  createTeamRole(teamId: number, role: AuthRole) {
    throw new FeatureNotAvailableError(this.edition)
  }

  deleteTeamRole(teamId: number, roleId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  updateTeamRole(teamId: number, roleId: number, role: Partial<AuthRole>) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async listTeamRoles(teamId: number) {
    return this.adminService.listTeamRoles(teamId)
  }

  async addBot(teamId: number, bot: Bot): Promise<void> {
    await this.adminService.addBot(teamId, bot)
  }

  async deleteBot(teamId: number, botId: string) {
    await this.adminService.deleteBot(teamId, botId)
  }

  async listBots(teamId: number, offset: number, limit: number) {
    return this.adminService.listBots(teamId, offset, limit)
  }

  async createNewTeam(args: { userId: number; name?: string | undefined }) {
    await this.adminService.createNewTeam(args)
  }

  async getBotTeam(botId: string) {
    return this.adminService.getBotTeam(botId)
  }

  async deleteTeam(teamId: number) {
    await this.adminService.deleteTeam(teamId)
  }

  async getInviteCode(teamId: number) {
    return this.adminService.getInviteCode(teamId)
  }

  async getUserPermissions(userId: number, teamId: number): Promise<AuthRule[]> {
    return this.adminService.getUserPermissions(userId, teamId)
  }

  async getUserRole(userId: number, teamId: number) {
    return this.adminService.getUserRole(userId, teamId)
  }

  async changeUserRole(userId: number, teamId: number, roleName: string) {
    await this.adminService.changeUserRole(userId, teamId, roleName)
  }

  async joinTeamFromInviteCode(userId: number, code: string) {
    await this.adminService.joinTeamFromInviteCode(userId, code)
  }

  async listTeamMembers(teamId: number) {
    return this.adminService.listTeamMembers(teamId)
  }

  async assertUserMember(userId: number, teamId: number) {
    await this.adminService.assertUserMember(userId, teamId)
  }

  async assertUserPermission(userId: number, teamId: number, resource: string, operation: string) {
    await this.adminService.assertUserPermission(userId, teamId, resource, operation)
  }

  async refreshInviteCode(teamId: number) {
    return this.adminService.refreshInviteCode(teamId)
  }

  async assertUserNotMember(userId: number, teamId: number) {
    await this.adminService.assertUserNotMember(userId, teamId)
  }

  async assertRoleExists(teamId: number, roleName: string) {
    await this.adminService.assertRoleExists(teamId, roleName)
  }

  async assertUserRole(userId: number, teamId: number, roleName: string) {
    await this.adminService.assertUserRole(userId, teamId, roleName)
  }
}
