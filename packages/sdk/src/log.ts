export type Logger = {
  debug(message: string, metadata?: unknown): void
  info(message: string, metadata?: unknown): void
  warn(message: string, metadata?: unknown): void
  error(message: string, metadata?: unknown): void
}
export const log: Logger = console
