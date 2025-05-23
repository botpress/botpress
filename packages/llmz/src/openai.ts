export namespace OAI {
  export type Roles = 'system' | 'user' | 'assistant'
  export type Message<R = Roles> = {
    name?: string
    content: string
    role: R
  }
}
