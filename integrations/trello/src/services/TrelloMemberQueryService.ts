import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { IMemberRepository } from '../interfaces/repositories/IMemberRepository'
import { IMemberQueryService } from '../interfaces/services/IMemberQueryService'
import { DIToken } from '../iocContainer'
import { Member } from '../schemas/entities/Member'

@injectable()
export class TrelloMemberQueryService implements IMemberQueryService {
  public constructor(@inject(DIToken.MemberRepository) private memberRepository: IMemberRepository) {}

  public async getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member> {
    return await this.memberRepository.getMemberByIdOrUsername(memberId)
  }
}
