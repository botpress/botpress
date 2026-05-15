import { GRAFANA } from '../const'
import { Client, getFlowState, pickFromList, reply, setFlowState, setTags, showList } from '../utils'

export const startContactPointPicker = async (
  client: Client,
  conversationId: string,
  userId: string,
  returnBranch: string
) => {
  await setFlowState(client, conversationId, { contactPointPickerReturnBranch: returnBranch })

  const { output } = await client.callAction({ type: `${GRAFANA}:listContactPoints`, input: {} })
  const { success, data } = output

  if (!success || !data?.length) {
    await reply(client, conversationId, userId, 'No contact points found. Enter the receiver name:')
    await setTags(client, conversationId, { branch: 'contact_point_picker', step: 'create_name' })
    return
  }

  await setFlowState(client, conversationId, { contactPointList: data })
  await showList(
    client,
    conversationId,
    userId,
    'Contact points:',
    data.map((cp) => `${cp.name ?? cp.uid} (${cp.type})`),
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
    const { output } = await client.callAction({ type: `${GRAFANA}:createContactPoint`, input: { name: input } as any })
    const { success, error } = output as { success: boolean; error?: string }
    if (!success) {
      await reply(
        client,
        conversationId,
        userId,
        `Failed to create contact point: ${error ?? 'Unknown error.'} Enter a name again:`
      )
      return
    }
    await onSelected(input)
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
