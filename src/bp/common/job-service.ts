export type MessageType = 'mount' | 'unmount' | 'reload_cms'
export type Channel = 'job_start' | 'job_done'
export const JobStartChannel: Channel = 'job_start'
export const JobDoneChannel: Channel = 'job_done'

export default interface JobService {
  onMount: ((botId) => Promise<void>)
  onUnmount: ((botId) => Promise<void>)
  executeJob(type: MessageType, args: any[]): Promise<void>
}
