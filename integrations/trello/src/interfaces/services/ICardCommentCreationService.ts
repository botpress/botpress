import { Card } from '../entities/Card'

export type ICardCommentCreationService = {
    createComment(cardId: Card['id'], commentBody: string): Promise<string>
}
