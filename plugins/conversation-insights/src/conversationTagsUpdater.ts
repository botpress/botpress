import { CommonProps } from 'src'
import * as gen from './generate-content'
import * as summarizer from './summary-prompt'
import * as bp from '.botpress'

type UpdateTitleAndSummaryProps = CommonProps & {
  conversation: bp.MessageHandlerProps['conversation']
  messages: string[]
  workflow: bp.WorkflowHandlerProps['updateSummary']['workflow']
}
export const updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  const prompt = summarizer.createPrompt({
    messages: props.messages,
    model: props.configuration.model,
    context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
  })
  let llmOutput = await props.actions.llm.generateContent(prompt)
  console.log(props.messages)
  let parsed = gen.parseLLMOutput(llmOutput)

  let attemptCount = 0
  const maxRetries = 3

  while (!parsed.success && attemptCount < maxRetries) {
    props.logger.debug(`Attempt ${attemptCount + 1}: The LLM output did not respect the schema.`, parsed.json)
    llmOutput = await props.actions.llm.generateContent(prompt)
    parsed = gen.parseLLMOutput(llmOutput)
    attemptCount++
  }

  if (!parsed.success) {
    props.logger.debug(`The LLM output did not respect the schema after ${attemptCount} retries.`, parsed.json)
    props.workflow.setFailed({
      failureReason: `Could not parse LLM title and summary output after ${attemptCount} retries`,
    })
    return
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags: {
      title: parsed.json.title,
      summary: parsed.json.summary,
      isDirty: 'false',
    },
  })
}
