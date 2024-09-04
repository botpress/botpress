import { Member } from '../../schemas/entities/Member'

export type IMemberRepository = {
  getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member>
}
