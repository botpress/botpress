import assert from 'assert'
import { Member } from '../schemas/entities/member'
import { BaseRepository } from './baseRepository'

export class TrelloMemberRepository extends BaseRepository {
  public async getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member> {
    try {
      const member = await this.trelloClient.members.getMember({
        id: memberId,
      })

      assert(member.id, 'Member id is not present')
      assert(member.username, 'Member username is not be present')
      assert(member.fullName, 'Member fullName is not be present')

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
