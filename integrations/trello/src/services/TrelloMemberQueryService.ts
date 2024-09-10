import { TrelloMemberRepository } from 'src/repositories/TrelloMemberRepository'
import { Member } from '../schemas/entities/Member'

export class TrelloMemberQueryService {
  public constructor(private readonly memberRepository: TrelloMemberRepository) {}

  public async getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member> {
    return await this.memberRepository.getMemberByIdOrUsername(memberId)
  }
}
