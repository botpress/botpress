import * as sdk from '@botpress/sdk'
import { printActionTriggeredMsg, getTools } from 'src/actions/helpers'
import * as bp from '.botpress'

export const boardMemberList: bp.Integration['actions']['boardMemberList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: boardId } = props.input
  if (!boardId) {
    throw new sdk.RuntimeError('Board ID is required: make sure the nextToken parameter contains the board ID')
  }

  const items = await trelloClient.getBoardMembers({ boardId })
  return { items, meta: {} }
}

export const boardMemberRead: bp.Integration['actions']['boardMemberRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: boardMemberId } = props.input
  if (!boardMemberId) {
    throw new sdk.RuntimeError('Member ID is required: make sure the id parameter contains the member ID')
  }

  const item = await trelloClient.getMemberByIdOrUsername({ memberId: boardMemberId })
  return { item, meta: {} }
}

export const cardMemberList: bp.Integration['actions']['cardMemberList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: cardId } = props.input
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the nextToken parameter contains the card ID')
  }

  const items = await trelloClient.getCardMembers({ cardId })
  return { items, meta: {} }
}

export const cardMemberRead: bp.Integration['actions']['cardMemberRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: cardMemberId } = props.input
  if (!cardMemberId) {
    throw new sdk.RuntimeError('Member ID is required: make sure the id parameter contains the member ID')
  }

  const item = await trelloClient.getMemberByIdOrUsername({ memberId: cardMemberId })
  return { item, meta: {} }
}
