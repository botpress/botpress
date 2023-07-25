export type TestProps = {
  tmpDir: string
  workspaceId: string
  token: string
  apiUrl: string
  tunnelUrl: string
}

export type Test = {
  name: string
  handler: (props: TestProps) => Promise<void>
}
