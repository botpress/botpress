import { TrelloClient } from 'trello.js'
import * as bp from '../../.botpress'
import {
  TrelloBoardRepository,
  TrelloCardCommentRepository,
  TrelloCardRepository,
  TrelloListRepository,
  TrelloMemberRepository,
  TrelloWebhookRepository,
} from '../repositories'
import { TrelloConfig } from '../schemas'
import { TrelloCardQueryService, TrelloBoardQueryService, TrelloCardUpdateService, TrelloListQueryService } from '.'

const initializeServices = (config: TrelloConfig) => {
  const trelloClient = new TrelloClient({
    key: config.trelloApiKey,
    token: config.trelloApiToken,
  })

  const boardRepository = new TrelloBoardRepository(trelloClient)
  const cardCommentRepository = new TrelloCardCommentRepository(trelloClient)
  const cardRepository = new TrelloCardRepository(trelloClient)
  const listRepository = new TrelloListRepository(trelloClient)
  const memberRepository = new TrelloMemberRepository(trelloClient)
  const webhookRepository = new TrelloWebhookRepository(trelloClient)

  const boardQueryService = new TrelloBoardQueryService(boardRepository)
  const cardQueryService = new TrelloCardQueryService(listRepository)
  const cardUpdateService = new TrelloCardUpdateService(cardRepository, listRepository)
  const listQueryService = new TrelloListQueryService(boardRepository)

  return {
    boardRepository,
    cardCommentRepository,
    cardRepository,
    listRepository,
    memberRepository,
    webhookRepository,

    boardQueryService,
    cardQueryService,
    cardUpdateService,
    listQueryService,
  }
}

export type Services = ReturnType<typeof initializeServices>
export const getServices = (ctx: bp.Context): Services => initializeServices(ctx.configuration)
