import { TrelloClient } from 'trello.js'
import { TrelloOperationError } from '../errors/TrelloOperationError'

export abstract class BaseRepository {
  protected constructor(protected trelloClient: TrelloClient) {}

  protected handleError(operation: string, error: unknown): never {
    throw new TrelloOperationError(`Error during ${operation}: ${error}`, error)
  }
}
