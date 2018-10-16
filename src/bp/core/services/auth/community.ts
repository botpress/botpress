import { AuthRole, AuthRule, Bot } from 'core/misc/interfaces'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'

import { FeatureNotAvailableError } from './errors'
import BaseTeamsService, { TeamsServiceFacade } from './teams-service'

@injectable()
export class CommunityTeamsService implements TeamsServiceFacade {
  constructor(
    @inject(TYPES.BaseTeamsService) private teamsService: BaseTeamsService,
    @inject(TYPES.BotpressEdition) private edition: string
  ) {}

  @postConstruct()
  init() {
    console.log('COMMUNITY')
  }

  addMemberToTeam(userId: number, teamId: number, roleName: string) {
    throw new FeatureNotAvailableError(this.edition)
  }

  removeMemberFromTeam(userId: any, teamId: any) {
    throw new FeatureNotAvailableError(this.edition)
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

  listTeamRoles(teamId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  addBot(teamId: number, bot: Bot): Promise<void> {
    throw new FeatureNotAvailableError(this.edition)
  }

  deleteBot(teamId: number, botId: string) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async listBots(teamId: number, offset: number, limit: number) {
    return this.teamsService.listBots(teamId, offset, limit)
  }

  createNewTeam(args: { userId: number; name?: string | undefined }) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async getBotTeam(botId: string) {
    return this.teamsService.getBotTeam(botId)
  }

  deleteTeam(teamId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  getInviteCode(teamId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  refreshInviteCode(teamId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  async getUserPermissions(userId: number, teamId: number): Promise<AuthRule[]> {
    return this.teamsService.getUserPermissions(userId, teamId)
  }

  getUserRole(userId: number, teamId: number) {
    throw new FeatureNotAvailableError(this.edition)
  }

  changeUserRole(userId: number, teamId: number, roleName: string) {
    throw new FeatureNotAvailableError(this.edition)
  }

  joinTeamFromInviteCode(userId: number, code: string) {
    throw new FeatureNotAvailableError(this.edition)
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
