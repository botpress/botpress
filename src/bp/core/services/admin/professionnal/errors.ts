export class RequestNotAvailableError extends Error {
  constructor(edition: string) {
    super(`This request is not available in the ${edition} edition of Botpress.`)
  }
}
