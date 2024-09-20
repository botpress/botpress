import { Logger } from '@bpinternal/log4bot'

export type TestProps = {
  logger: Logger
  tmpDir: string
  workspaceId: string
  workspaceHandle: string
  token: string
  apiUrl: string
  tunnelUrl: string
  dependencies: Record<string, string | undefined>
}

export type Test = {
  name: string
  handler: (props: TestProps) => Promise<void>
}
