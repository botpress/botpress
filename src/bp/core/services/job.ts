import JobService, { MessageType } from 'common/job-service'
import { injectable } from 'inversify'

@injectable()
export class CEJobService implements JobService {
  async execJob(type: MessageType, job: Function): Promise<void> {
    await job()
  }
}
