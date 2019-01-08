import { injectable } from 'inversify'

export interface JobService {
  broadcast(fn: Function, jobName?: string): Promise<Function>
}

@injectable()
export class CEJobService implements JobService {
  async broadcast(fn: Function, jobName?: string): Promise<Function> {
    return fn
  }
}
