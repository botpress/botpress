export type TestProps = {
  tmpDir: string
  workspaceId: string
  token: string
  apiUrl: string
  tunnelUrl: string
  dependencies: Record<string, string | undefined>
}

export type Test = {
  name: string
  handler: (props: TestProps) => Promise<void>
}
