import 'reflect-metadata'
import assert from 'assert'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { IMemberRepository } from '../interfaces/repositories/IMemberRepository'
import { DIToken } from '../iocContainer'
import { Member } from '../schemas/entities/Member'
import { BaseRepository } from './BaseRepository'

@injectable()
export class TrelloMemberRepository extends BaseRepository implements IMemberRepository {
  public constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
    super(trelloClient)
  }
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
