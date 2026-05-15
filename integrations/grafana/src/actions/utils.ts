export async function getK8sNamespace(props: {
  ctx: { integrationId: string }
  client: { getState: Function }
}): Promise<string> {
  const { state } = await props.client.getState({
    type: 'integration',
    name: 'webhookConfig',
    id: props.ctx.integrationId,
  })
  return state.payload.k8sNamespace
}
