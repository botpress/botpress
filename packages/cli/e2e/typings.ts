export type TestProps = {
  tmpDir: string
  workspaceId: string
  token: string
  apiUrl: string
}

export type Test = {
  name: string
  handler: (props: TestProps) => Promise<void>
}
