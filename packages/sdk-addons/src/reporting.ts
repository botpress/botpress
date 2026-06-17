import { Integration } from '@botpress/sdk'

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

type Tof<I extends Integration> = I extends Integration<infer T> ? T : never

// TODO: currently a no-op, intended to be extended with other reporters (e.g. PostHog) later
export const wrapIntegration = <T extends Tof<Integration>>(integration: Integration<T>) => {
  return integration
}
