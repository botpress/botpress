import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

type LLMInput = bp.interfaces.llm.actions.generateContent.input.Input
type LLMOutput = bp.interfaces.llm.actions.generateContent.output.Output

type GenerateContentProps = {
  integrationName: string
  client: bp.Client
  input: LLMInput
}
// eslint-disable-next-line unused-imports/no-unused-vars
const generateContent = async (props: GenerateContentProps): Promise<LLMOutput> => {
  const { integrationName, client, input } = props
  const response = await client.callAction({
    type: `${integrationName}.generateContent`,
    input,
  })
  return response.output
}

plugin.hook.beforeOutgoingMessage('*', async ({ data: message }) => {
  if (message.type !== 'text') {
    return { data: message }
  }

  // TODO: implement

  return { data: message }
})

export default plugin
