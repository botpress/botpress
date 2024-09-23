import { TrelloClient } from 'trello.js'
import { TrelloOperationError } from '../errors/trelloOperationError'

export abstract class BaseRepository {
  public constructor(protected readonly trelloClient: TrelloClient) {}

  protected handleError(operation: string, error: unknown): never {
    throw new TrelloOperationError(`Error during ${operation}: ${error}`, error)
  }
}
