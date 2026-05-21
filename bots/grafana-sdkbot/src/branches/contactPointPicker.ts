import { GRAFANA } from '../const'
import { Client, getFlowState, pickFromList, reply, setFlowState, setTags, showList } from '../utils'

export const startContactPointPicker = async (
  client: Client,
  conversationId: string,
  userId: string,
  returnBranch: string
) => {
  await setFlowState(client, conversationId, { contactPointPickerReturnBranch: returnBranch })

  let contactPoints
  try {
    const { output } = await client.callAction({ type: `${GRAFANA}:listContactPoints`, input: {} })
    contactPoints = output.contactPoints
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Failed to load contact points: ${err instanceof Error ? err.message : String(err)} Enter the receiver name:`
    )
    await setTags(client, conversationId, { branch: 'contact_point_picker', step: 'create_name' })
    return
  }

  if (!contactPoints?.length) {
    await reply(client, conversationId, userId, 'No contact points found. Enter the receiver name:')
    await setTags(client, conversationId, { branch: 'contact_point_picker', step: 'create_name' })
    return
  }

  await setFlowState(client, conversationId, { contactPointList: contactPoints })
  await showList(
    client,
    conversationId,
    userId,
    'Contact points:',
    contactPoints.map((cp) => `${cp.name ?? cp.uid} (${cp.type})`),
    [{ label: 'Get notifications on this bot', value: '0' }]
  )
  await setTags(client, conversationId, { branch: 'contact_point_picker', step: '' })
}

export const handleContactPointPicker = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  onSelected: (name: string) => Promise<void>
) => {
  if (step === 'create_name') {
    try {
      await client.callAction({ type: `${GRAFANA}:createContactPoint`, input: { name: input } as any })
      await onSelected(input)
    } catch (err) {
      await reply(
        client,
        conversationId,
        userId,
        `Failed to create contact point: ${err instanceof Error ? err.message : String(err)} Enter a name again:`
      )
    }
    return
  }

  const state = await getFlowState(client, conversationId)
  const contactPoints = state.contactPointList ?? []

  if (input === '0') {
    await reply(client, conversationId, userId, 'Enter the contact point name:')
    await setTags(client, conversationId, { branch: 'contact_point_picker', step: 'create_name' })
    return
  }

  const cp = pickFromList(contactPoints, input)
  if (!cp) {
    await showList(
      client,
      conversationId,
      userId,
      'Invalid selection. Contact points:',
      contactPoints.map((c) => `${c.name ?? c.uid} (${c.type})`),
      [{ label: 'Get notifications on this bot', value: '0' }]
    )
    return
  }

  await onSelected(cp.name ?? cp.uid ?? '')
}
