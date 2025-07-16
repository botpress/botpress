import { Client } from '@botpress/client'
import { execute, ThinkSignal } from 'llmz'
import Zai from '@botpress/zai'
import { CLIChat } from '../utils/cli-chat'
import chalk from 'chalk'
import { loading } from '../utils/spinner'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const zai = new Zai.Zai({
  client,
})

const guardrails = {
  violence: 'The code is free of violence or threats. (true = no violence, false = contains violence)',
  hate: 'The code is free of hate speech or discrimination. (true = no hate speech, false = contains hate speech)',
  pii: 'The code does not collect or use personal data. (true = no personal data, false = collects personal data)',
  french: 'The code does not use French language. (true = no French, false = contains French)',
} as const

const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    client,
    chat,
    instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',
    async onBeforeExecution(iteration) {
      loading(true, chalk.dim('👀 Checking guardrails...'))
      const checks = await zai.label(iteration.code, guardrails)
      loading(false)

      const breaches: string[] = []

      for (const [guardrail, result] of Object.entries(checks)) {
        if (result.value === false) {
          breaches.push(
            `Guardrail "${guardrails[guardrail as keyof typeof guardrails]}" violated: ${result.explanation}.`
          )
        }
      }

      if (breaches.length > 0) {
        console.log(chalk.red('🚨 Code violates guardrails: ' + breaches.map((x) => '- ' + x).join('\n')))
        const message = `🚨 Code violates the following guardrails:\n\n${breaches.join('\n')}\n\nPlease fix the code to comply with the guardrails and try again. Do not mention the error to the user.`
        throw new ThinkSignal(message)
      } else {
        console.log(chalk.green('✓') + chalk.dim(' guardrails ok'))
      }
    },
  })
}
