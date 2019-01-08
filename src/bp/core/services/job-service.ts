import { injectable } from 'inversify'

export interface JobService {
  /**
   * * In Botpress Pro, this allows to broadcast a job to execute to all distributed nodes.
   * It returns a function that returns a promise.
   * The promise will succeed if all nodes have run the job and will fail otherwise.
   *
   * * In Botpress CE, the function will be returned directly.
   * @param fn The function or "job" to execute
   */
  broadcast(fn: Function): Promise<Function>
}

@injectable()
export class CEJobService implements JobService {
  async broadcast(fn: Function): Promise<Function> {
    return fn
  }
}
