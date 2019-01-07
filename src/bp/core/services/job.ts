import JobService, { MessageType } from 'common/job-service'
import { injectable } from 'inversify'

@injectable()
export class SingleNodeJobService implements JobService {
  onMount!: (botId: string) => Promise<void>
  onUnmount!: (botId: string) => Promise<void>

  async executeJob(type: MessageType, args: any[]): Promise<void> {
    if (type === 'mount') {
      this.onMount && (await this.onMount(args[0]))
    } else if (type === 'unmount') {
      this.onUnmount && (await this.onUnmount(args[0]))
    } else {
      throw new Error(`Unknow job type "${type}"`)
    }
  }
}
