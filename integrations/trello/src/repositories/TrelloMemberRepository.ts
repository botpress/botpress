import 'reflect-metadata'
import { TrelloClient } from 'trello.js'
import { inject, injectable } from 'tsyringe'
import { IMemberRepository } from '../interfaces/repositories/IMemberRepository'
import { DIToken } from '../iocContainer'
import { Member } from '../schemas/entities/Member'
import { BaseRepository } from './BaseRepository'

@injectable()
export class TrelloMemberRepository extends BaseRepository implements IMemberRepository {
  constructor(@inject(DIToken.TrelloClient) trelloClient: TrelloClient) {
    super(trelloClient)
  }
  async getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member> {
    try {
      const member = await this.trelloClient.members.getMember({
        id: memberId,
      })

      return {
        id: member.id!,
        username: member.username!,
        fullName: member.fullName!,
      }
    } catch (error) {
      this.handleError(`getMemberByIdOrUsername for member ${memberId}`, error)
    }
  }
}
