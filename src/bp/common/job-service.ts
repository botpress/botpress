export type MessageType = 'mount' | 'unmount' | 'reload_cms'
export type Channel = 'job_start' | 'job_done'
export const JOB_START_CHANNEL: Channel = 'job_start'
export const JOB_DONE_CHANNEL: Channel = 'job_done'

export default interface JobService {
  execJob(type: MessageType, job: Function): Promise<void>
}
