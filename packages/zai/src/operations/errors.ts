export class JsonParsingError extends Error {
  public constructor(
    public json: unknown,
    public error: Error
  ) {
    const message = `Error parsing JSON:\n\n---JSON---\n${json}\n\n---Error---\n\n ${error}`
    super(message)
  }
}
