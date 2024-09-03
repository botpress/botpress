import { TrelloID } from 'src/schemas'
import { Card } from '../../schemas/entities/Card'

export type ICardCommentCreationService = {
  createComment(cardId: Card['id'], commentBody: string): Promise<TrelloID>
}
