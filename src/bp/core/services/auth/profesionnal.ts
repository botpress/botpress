import { AuthRole, AuthRule, Bot } from 'core/misc/interfaces'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'

import { FeatureNotAvailableError } from './errors'
import BaseTeamsService, { TeamsServiceFacade } from './teams-service'

@injectable()
export class ProfessionnalTeamsService implements TeamsServiceFacade {
  constructor(
    @inject(TYPES.BaseTeamsService) private teamsService: BaseTeamsService,
    @inject(TYPES.BotpressEdition) private edition: string
  ) {}

  @postConstruct()
  init() {
    console.log('PRO')
  }

  async addMemberToTeam(userId: number, teamId: number, roleName: string) {
    await this.teamsService.addMemberToTeam(userId, teamId, roleName)
  }

  async removeMemberFromTeam(userId: any, teamId: any) {
    await this.teamsService.removeMemberFromTeam(userId, teamId)
  }

  async listUserTeams(userId: number) {
    return this.teamsService.listUserTeams(userId)
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
    return this.teamsService.listTeamRoles(teamId)
  }

  async addBot(teamId: number, bot: Bot): Promise<void> {
    await this.teamsService.addBot(teamId, bot)
  }

  async deleteBot(teamId: number, botId: string) {
    await this.teamsService.deleteBot(teamId, botId)
  }

  async listBots(teamId: number, offset: number, limit: number) {
    return this.teamsService.listBots(teamId, offset, limit)
  }

  async createNewTeam(args: { userId: number; name?: string | undefined }) {
    await this.teamsService.createNewTeam(args)
  }

  async getBotTeam(botId: string) {
    return this.teamsService.getBotTeam(botId)
  }

  async deleteTeam(teamId: number) {
    await this.teamsService.deleteTeam(teamId)
  }

  async getInviteCode(teamId: number) {
    return this.teamsService.getInviteCode(teamId)
  }

  async getUserPermissions(userId: number, teamId: number): Promise<AuthRule[]> {
    return this.teamsService.getUserPermissions(userId, teamId)
  }

  async getUserRole(userId: number, teamId: number) {
    return this.teamsService.getUserRole(userId, teamId)
  }

  async changeUserRole(userId: number, teamId: number, roleName: string) {
    await this.teamsService.changeUserRole(userId, teamId, roleName)
  }

  async joinTeamFromInviteCode(userId: number, code: string) {
    await this.teamsService.joinTeamFromInviteCode(userId, code)
  }

  async listTeamMembers(teamId: number) {
    return this.teamsService.listTeamMembers(teamId)
  }

  async assertUserMember(userId: number, teamId: number) {
    await this.teamsService.assertUserMember(userId, teamId)
  }

  async assertUserPermission(userId: number, teamId: number, resource: string, operation: string) {
    await this.teamsService.assertUserPermission(userId, teamId, resource, operation)
  }

  async refreshInviteCode(teamId: number) {
    return this.teamsService.refreshInviteCode(teamId)
  }

  async assertUserNotMember(userId: number, teamId: number) {
    await this.teamsService.assertUserNotMember(userId, teamId)
  }

  async assertRoleExists(teamId: number, roleName: string) {
    await this.teamsService.assertRoleExists(teamId, roleName)
  }

  async assertUserRole(userId: number, teamId: number, roleName: string) {
    await this.teamsService.assertUserRole(userId, teamId, roleName)
  }
}
