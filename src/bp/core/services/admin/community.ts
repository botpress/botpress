import { Logger } from 'botpress/sdk'
import { BotLoader } from 'core/bot-loader'
import { BotConfigFactory, BotConfigWriter } from 'core/config'
import Database from 'core/database'
import { AuthRole, AuthRule, Bot } from 'core/misc/interfaces'
import { ModuleLoader } from 'core/module-loader'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

import { GhostService } from '..'

import CoreAdminService, { AdminService } from './professionnal/admin-service'
import { RequestNotAvailableError } from './professionnal/errors'

@injectable()
export class CommunityAdminService implements AdminService {
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

  addMemberToTeam(userId: number, teamId: number, roleName: string) {
    throw new RequestNotAvailableError(this.edition)
  }

  removeMemberFromTeam(userId: any, teamId: any) {
    throw new RequestNotAvailableError(this.edition)
  }

  async listUserTeams(userId: number) {
    return this.adminService.listUserTeams(userId)
  }

  createTeamRole(teamId: number, role: AuthRole) {
    throw new RequestNotAvailableError(this.edition)
  }

  deleteTeamRole(teamId: number, roleId: number) {
    throw new RequestNotAvailableError(this.edition)
  }

  updateTeamRole(teamId: number, roleId: number, role: Partial<AuthRole>) {
    throw new RequestNotAvailableError(this.edition)
  }

  listTeamRoles(teamId: number) {
    throw new RequestNotAvailableError(this.edition)
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

  createNewTeam(args: { userId: number; name?: string | undefined }) {
    throw new RequestNotAvailableError(this.edition)
  }

  async getBotTeam(botId: string) {
    return this.adminService.getBotTeam(botId)
  }

  deleteTeam(teamId: number) {
    throw new RequestNotAvailableError(this.edition)
  }

  getInviteCode(teamId: number) {
    throw new RequestNotAvailableError(this.edition)
  }

  refreshInviteCode(teamId: number) {
    throw new RequestNotAvailableError(this.edition)
  }

  async getUserPermissions(userId: number, teamId: number): Promise<AuthRule[]> {
    return this.adminService.getUserPermissions(userId, teamId)
  }

  getUserRole(userId: number, teamId: number) {
    throw new RequestNotAvailableError(this.edition)
  }

  changeUserRole(userId: number, teamId: number, roleName: string) {
    throw new RequestNotAvailableError(this.edition)
  }

  joinTeamFromInviteCode(userId: number, code: string) {
    throw new RequestNotAvailableError(this.edition)
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
