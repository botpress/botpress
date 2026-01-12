import * as sdk from '@botpress/sdk'
import { printActionTriggeredMsg, getTools } from './helpers'
import * as bp from '.botpress'

export const cardList: bp.Integration['actions']['cardList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: listId } = props.input
  if (!listId) {
    throw new sdk.RuntimeError('List ID is required: make sure the nextToken parameter contains the list ID')
  }

  const items = await trelloClient.getCardsInList({ listId })
  return { items, meta: {} }
}

export const cardRead: bp.Integration['actions']['cardRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: cardId } = props.input
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the id parameter contains the card ID')
  }

  const item = await trelloClient.getCardById({ cardId })
  return { item, meta: {} }
}

export const cardCreate: bp.Integration['actions']['cardCreate'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { item } = props.input
  const newCard = await trelloClient.createCard({
    card: item,
  })

  return { item: newCard, meta: {} }
}

export const cardUpdate: bp.Integration['actions']['cardUpdate'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { item } = props.input
  const newCard = await trelloClient.updateCard({
    partialCard: item,
  })

  return { item: newCard, meta: {} }
}

export const cardDelete: bp.Integration['actions']['cardDelete'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: cardId } = props.input
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the id parameter contains the card ID')
  }

  // This effectively archives the card (soft deletion):
  const item = await trelloClient.updateCard({ partialCard: { id: cardId, isClosed: true } })

  return { item, meta: {} }
}
