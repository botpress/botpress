import { Member } from '../../schemas/entities/Member'

export type IMemberQueryService = {
  getMemberByIdOrUsername(memberId: Member['id'] | Member['username']): Promise<Member>
}
