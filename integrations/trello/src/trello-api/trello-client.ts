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
import { UpdateCardPayload, CreateCardPayload } from './types'
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

  public async getBoardMembers({ boardId }: { boardId: Board['id'] }): Promise<Member[]> {
    const members = await this._trelloJs.boards
      .getBoardMembers<TrelloJsModels.Member[]>({
        id: boardId,
      })
      .catch(_useHandleCaughtError('Failed to retrieve board members'))

    return members.map(ResponseMapping.mapMember)
  }

  public async getBoardById({ boardId }: { boardId: Board['id'] }): Promise<Board> {
    const board = await this._trelloJs.boards
      .getBoard({
        id: boardId,
      })
      .catch(_useHandleCaughtError('Failed to retrieve board by id'))

    return ResponseMapping.mapBoard(board)
  }

  public async getAllBoards(): Promise<Board[]> {
    const boards = await this._trelloJs.members
      .getMemberBoards({
        id: 'me',
      })
      .catch(_useHandleCaughtError('Failed to retrieve all boards'))

    return boards.map(ResponseMapping.mapBoard)
  }

  public async getListsInBoard({ boardId }: { boardId: Board['id'] }): Promise<List[]> {
    const lists = await this._trelloJs.boards
      .getBoardLists({
        id: boardId,
      })
      .catch(_useHandleCaughtError('Failed to retrieve lists in board'))

    return lists.map(ResponseMapping.mapList)
  }

  public async addCardComment({ cardId, commentBody }: { cardId: Card['id']; commentBody: string }): Promise<TrelloID> {
    const comment = await this._trelloJs.cards
      .addCardComment({
        id: cardId,
        text: commentBody,
      })
      .catch(_useHandleCaughtError('Failed to add comment to card'))

    return ResponseMapping.mapTrelloId(comment.id)
  }

  public async getCardById({ cardId }: { cardId: Card['id'] }): Promise<Card> {
    const card = await this._trelloJs.cards
      .getCard({
        id: cardId,
      })
      .catch(_useHandleCaughtError('Failed to get card by id'))

    return ResponseMapping.mapCard(card)
  }

  public async createCard({ card }: { card: CreateCardPayload }): Promise<Card> {
    const newCard = await this._trelloJs.cards
      .createCard(RequestMapping.mapCreateCard(card))
      .catch(_useHandleCaughtError('Failed to create card'))

    return ResponseMapping.mapCard(newCard)
  }

  public async updateCard({ partialCard }: { partialCard: UpdateCardPayload }): Promise<Card> {
    const updatedCard = await this._trelloJs.cards
      .updateCard(RequestMapping.mapUpdateCard(partialCard))
      .catch(_useHandleCaughtError('Failed to update card'))

    return ResponseMapping.mapCard(updatedCard)
  }

  /** Hard deletes a Trello card.
   *
   *  @remark For soft deletion use "updateCard" with "isClosed" as true */
  public async deleteCard(cardId: Card['id']): Promise<void> {
    await this._trelloJs.cards
      .deleteCard({
        id: cardId,
      })
      .catch(_useHandleCaughtError('Failed to delete card'))
  }

  public async getListById({ listId }: { listId: List['id'] }): Promise<List> {
    const list = await this._trelloJs.lists
      .getList<TrelloJsModels.List>({
        id: listId,
      })
      .catch(_useHandleCaughtError('Failed to get list by id'))

    return ResponseMapping.mapList(list)
  }

  public async getCardsInList({ listId }: { listId: List['id'] }): Promise<Card[]> {
    const cards = await this._trelloJs.lists
      .getListCards({
        id: listId,
      })
      .catch(_useHandleCaughtError('Failed to get cards in list'))

    return cards.map(ResponseMapping.mapCard)
  }

  public async getMemberByIdOrUsername({ memberId }: { memberId: Member['id'] | Member['username'] }): Promise<Member> {
    const member = await this._trelloJs.members
      .getMember({
        id: memberId,
      })
      .catch(_useHandleCaughtError('Failed to get member by id or username'))

    return ResponseMapping.mapMember(member)
  }

  public async listWebhooks(): Promise<Webhook[]> {
    const rawWebhooks = await this._trelloJs.tokens
      .getTokenWebhooks<TrelloJsModels.Webhook[]>({
        token: this._token,
      })
      .catch(_useHandleCaughtError('Failed to list webhooks'))

    const mappedWebhooks = rawWebhooks.map(ResponseMapping.mapWebhook)
    const result = webhookSchema.array().safeParse(mappedWebhooks)

    if (!result.success) {
      throw new RuntimeError('Unexpected webhook data format received from Trello')
    }

    return result.data
  }

  public async createWebhook({
    description,
    url,
    modelId,
  }: {
    description: string
    url: string
    modelId: string
  }): Promise<Webhook> {
    const webhook = await this._trelloJs.webhooks
      .createWebhook({
        description,
        callbackURL: url,
        idModel: modelId,
      })
      .catch(_useHandleCaughtError('Failed to create webhook'))

    return ResponseMapping.mapWebhook(webhook)
  }

  public async deleteWebhook({ id }: { id: string }): Promise<void> {
    await this._trelloJs.webhooks
      .deleteWebhook({
        id,
      })
      .catch(_useHandleCaughtError('Failed to delete webhook'))
  }

  public async getCardMembers({ cardId }: { cardId: Card['id'] }): Promise<Member[]> {
    const members = await this._trelloJs.cards
      .getCardMembers<TrelloJsModels.Member[]>({
        id: cardId,
      })
      .catch(_useHandleCaughtError('Failed to get card members'))

    return members.map(ResponseMapping.mapMember)
  }
}
