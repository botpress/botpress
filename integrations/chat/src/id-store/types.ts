export type IdMap = {
  find: (src: string) => Promise<string | undefined>
  /** just like find, but returns the src id if not found */
  get: (src: string) => Promise<string>
}

export type IncomingIdMap = IdMap & {
  set: (src: string, dest: string) => Promise<void>
  delete: (src: string) => Promise<void>
}

export type OutoingIdMap = IdMap & {
  fetch: (srcs: string[]) => Promise<{
    find: (src: string) => string | undefined
    get: (src: string) => string
  }>
}

export type ChatIdStore = {
  byFid: IncomingIdMap
  byId: OutoingIdMap
}
