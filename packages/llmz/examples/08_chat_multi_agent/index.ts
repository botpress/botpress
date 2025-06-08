import { Client } from '@botpress/client'
import { execute } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

import { MainAgent } from './agent_main'
import { HRAgent } from './agent_hr'
import { ITAgent } from './agent_it'
import { SalesAgent } from './agent_sales'

import { MultiAgentOrchestrator } from './orchestrator'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const chat = new CLIChat()
const orchestrator = new MultiAgentOrchestrator([MainAgent, HRAgent, ITAgent, SalesAgent], MainAgent.name)

while (true) {
  const result = await execute({
    ...orchestrator.context,
    client,
    chat,
  })

  if (!orchestrator.hasHandedOff(result)) {
    await chat.prompt()
  }
}
