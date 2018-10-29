import { AuthRole, AuthRule, Bot } from 'core/misc/interfaces'

export interface AdminService {
  listUsers()
  createUser(username: string)
  deleteUser(userId: any)
  resetPassword(userId: any)

  updateUserProfile(userId: number, firstname: string, lastname: string)

  addMemberToTeam(userId: number, teamId: number, roleName: string)
  removeMemberFromTeam(userId, teamId)
  listUserTeams(userId: number)

  createTeamRole(teamId: number, role: AuthRole)
  deleteTeamRole(teamId: number, roleId: number)
  updateTeamRole(teamId: number, roleId: number, role: Partial<AuthRole>)
  listTeamRoles(teamId: number)

  addBot(teamId: number, bot: Bot): Promise<void>
  deleteBot(teamId: number, botId: string)
  listBots(teamId: number, offset?: number, limit?: number)

  createNewTeam(args: { userId: number; name?: string })
  getBotTeam(botId: string)
  deleteTeam(teamId: number)

  getUserPermissions(userId: number, teamId: number): Promise<AuthRule[]>
  getUserRole(userId: number, teamId: number)
  changeUserRole(userId: number, teamId: number, roleName: string)

  listTeamMembers(teamId: number)

  assertUserMember(userId: number, teamId: number)
  assertUserPermission(userId: number, teamId: number, resource: string, operation: string)
  assertUserNotMember(userId: number, teamId: number)
  assertRoleExists(teamId: number, roleName: string)
  assertUserRole(userId: number, teamId: number, roleName: string)
  assertIsRootAdmin(userId: number)
}
