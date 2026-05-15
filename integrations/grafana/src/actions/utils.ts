export async function getK8sNamespace(props: {
  ctx: { integrationId: string }
  client: { getState: Function }
}): Promise<{ success: true; ns: string } | { success: false; error: string }> {
  try {
    const { state } = await props.client.getState({
      type: 'integration',
      name: 'webhookConfig',
      id: props.ctx.integrationId,
    })
    return { success: true, ns: state.payload.k8sNamespace }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
