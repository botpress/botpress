import { Member } from 'definitions/schemas'
import { BaseRepository } from './baseRepository'

export class TrelloMemberRepository extends BaseRepository {
  public async getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member> {
    try {
      const member = (await this.trelloClient.members.getMember({
        id: memberId,
      })) satisfies Required<Pick<Member, 'id' | 'username' | 'fullName'>> & Member

      return {
        id: member.id,
        username: member.username,
        fullName: member.fullName,
      }
    } catch (error) {
      this.handleError(`getMemberByIdOrUsername for member ${memberId}`, error)
    }
  }
}
