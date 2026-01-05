import { RuntimeError } from '@botpress/sdk'
import {
  webhookSchema,
  type Board,
  type Card,
  type List,
  type Member,
  type TrelloID,
  type Webhook,
} from 'definitions/schemas'
import { TrelloClient as TrelloJs, type Models as TrelloJsModels } from 'trello.js'
import { RequestMapping } from './mapping/request-mapping'
import { ResponseMapping } from './mapping/response-mapping'
import * as bp from '.botpress'

const _useHandleCaughtError = (message: string) => {
  return (thrown: unknown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`${message}: ${error.message}`)
  }
}

export class TrelloClient {
  private readonly _trelloJs: TrelloJs
  private readonly _token: string

  public constructor({ ctx }: { ctx: bp.Context }) {
    this._token = ctx.configuration.trelloApiToken
    this._trelloJs = new TrelloJs({ key: ctx.configuration.trelloApiKey, token: ctx.configuration.trelloApiToken })
  }

  public getBoardMembers({ boardId }: { boardId: Board['id'] }): Promise<Member[]> {
    return this._trelloJs.boards
      .getBoardMembers<TrelloJsModels.Member[]>({
        id: boardId,
      })
      .catch(_useHandleCaughtError('Failed to retrieve board members'))
      .then((members) => members.map(ResponseMapping.mapMember))
  }

  public getBoardById({ boardId }: { boardId: Board['id'] }): Promise<Board> {
    return this._trelloJs.boards
      .getBoard({
        id: boardId,
      })
      .catch(_useHandleCaughtError('Failed to retrieve board by id'))
      .then((board) => ResponseMapping.mapBoard(board))
  }

  public getAllBoards(): Promise<Board[]> {
    return this._trelloJs.members
      .getMemberBoards({
        id: 'me',
      })
      .catch(_useHandleCaughtError('Failed to retrieve all boards'))
      .then((boards) => boards.map(ResponseMapping.mapBoard))
  }

  public getListsInBoard({ boardId }: { boardId: Board['id'] }): Promise<List[]> {
    return this._trelloJs.boards
      .getBoardLists({
        id: boardId,
      })
      .catch(_useHandleCaughtError('Failed to retrieve lists in board'))
      .then((lists) => lists.map(ResponseMapping.mapList))
  }

  public addCardComment({ cardId, commentBody }: { cardId: Card['id']; commentBody: string }): Promise<TrelloID> {
    return this._trelloJs.cards
      .addCardComment({
        id: cardId,
        text: commentBody,
      })
      .catch(_useHandleCaughtError('Failed to add comment to card'))
      .then((comment) => ResponseMapping.mapTrelloId(comment.id))
  }

  public getCardById({ cardId }: { cardId: Card['id'] }): Promise<Card> {
    return this._trelloJs.cards
      .getCard({
        id: cardId,
      })
      .catch(_useHandleCaughtError('Failed to get card by id'))
      .then((card) => ResponseMapping.mapCard(card))
  }

  public createCard({ card }: { card: Pick<Card, 'name' | 'description' | 'listId'> & Partial<Card> }): Promise<Card> {
    return this._trelloJs.cards
      .createCard(RequestMapping.mapCreateCard(card))
      .catch(_useHandleCaughtError('Failed to create card'))
      .then((newCard) => ResponseMapping.mapCard(newCard))
  }

  public updateCard({ partialCard }: { partialCard: Pick<Card, 'id'> & Partial<Card> }): Promise<Card> {
    return this._trelloJs.cards
      .updateCard(RequestMapping.mapUpdateCard(partialCard))
      .catch(_useHandleCaughtError('Failed to update card'))
      .then((updatedCard) => ResponseMapping.mapCard(updatedCard))
  }

  public getListById({ listId }: { listId: List['id'] }): Promise<List> {
    return this._trelloJs.lists
      .getList<TrelloJsModels.List>({
        id: listId,
      })
      .catch(_useHandleCaughtError('Failed to get list by id'))
      .then((list) => ResponseMapping.mapList(list))
  }

  public getCardsInList({ listId }: { listId: List['id'] }): Promise<Card[]> {
    return this._trelloJs.lists
      .getListCards({
        id: listId,
      })
      .catch(_useHandleCaughtError('Failed to get cards in list'))
      .then((cards) => cards.map(ResponseMapping.mapCard))
  }

  public getMemberByIdOrUsername({ memberId }: { memberId: Member['id'] | Member['username'] }): Promise<Member> {
    return this._trelloJs.members
      .getMember({
        id: memberId,
      })
      .catch(_useHandleCaughtError('Failed to get member by id or username'))
      .then((member) => ResponseMapping.mapMember(member))
  }

  public listWebhooks(): Promise<Webhook[]> {
    return this._trelloJs.tokens
      .getTokenWebhooks<TrelloJsModels.Webhook[]>({
        token: this._token,
      })
      .catch(_useHandleCaughtError('Failed to list webhooks'))
      .then((rawWebhooks) => {
        const mappedWebhooks = rawWebhooks.map(ResponseMapping.mapWebhook)
        const result = webhookSchema.array().safeParse(mappedWebhooks)

        if (!result.success) {
          throw new RuntimeError('Invalid webhook data received from Trello')
        }

        return result.data
      })
  }

  public createWebhook({
    description,
    url,
    modelId,
  }: {
    description: string
    url: string
    modelId: string
  }): Promise<Webhook> {
    return this._trelloJs.webhooks
      .createWebhook({
        description,
        callbackURL: url,
        idModel: modelId,
      })
      .catch(_useHandleCaughtError('Failed to create webhook'))
      .then((webhook) => ResponseMapping.mapWebhook(webhook))
  }

  public deleteWebhook({ id }: { id: string }): Promise<void> {
    return this._trelloJs.webhooks
      .deleteWebhook({
        id,
      })
      .catch(_useHandleCaughtError('Failed to delete webhook'))
      .then(() => {})
  }

  public getCardMembers({ cardId }: { cardId: Card['id'] }): Promise<Member[]> {
    return this._trelloJs.cards
      .getCardMembers<TrelloJsModels.Member[]>({
        id: cardId,
      })
      .catch(_useHandleCaughtError('Failed to get card members'))
      .then((members) => members.map(ResponseMapping.mapMember))
  }
}
