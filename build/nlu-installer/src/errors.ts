export class UnsuportedOSError extends Error {
  constructor(platform: string) {
    super(`Operating System ${platform} no supported.`)
  }
}
