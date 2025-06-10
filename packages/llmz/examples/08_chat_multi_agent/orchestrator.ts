import { z } from '@bpinternal/zui'
import chalk from 'chalk'
import { execute, Exit, type ExecutionResult, type ExitResult } from 'llmz'

export type SubAgent = {
  name: string
  description: string
  positive_examples: string[]
  instructions: ExecutionResult['context']['instructions']
  tools?: ExecutionResult['context']['tools']
  objects?: ExecutionResult['context']['objects']
}

/**
 * This is a minimal multi-agent orchestration framework that allows for dynamic handoffs between agents.
 * This system can scale to hundreds of sub-agents, each with dozens or even hundreds of tools.
 * It is designed to handle complex inquiries by allowing agents to hand off requests to other agents.
 */
export class MultiAgentOrchestrator {
  private agents: SubAgent[]
  private currentAgentName: string

  private previousHandoffs: Array<{
    from: string
    to: string
    reason: string
  }> = []

  constructor(agents: SubAgent[], initialAgentName: string) {
    this.agents = agents
    this.currentAgentName = initialAgentName
  }

  hasHandedOff(result: ExecutionResult): boolean {
    return result.status === 'success' && isHandoffMetadata(result.result.exit.metadata)
  }

  setCurrentAgent(agentName: string) {
    if (!this.agents.some((agent) => agent.name === agentName)) {
      throw new Error(`Agent ${agentName} does not exist`)
    }
    this.currentAgentName = agentName
  }

  get currentAgent(): SubAgent {
    const agent = this.agents.find((agent) => agent.name === this.currentAgentName)
    if (!agent) {
      throw new Error(`Current agent ${this.currentAgentName} not found`)
    }
    return agent
  }

  get availableAgents(): SubAgent[] {
    return this.agents.filter((agent) => agent.name !== this.currentAgentName)
  }

  get context(): ControlledContextProps {
    const instructions = () => `You are a multi-agent system that can handle various inquiries.
You are currently handling inquiries related to "${this.currentAgent.name}" ${this.currentAgent.description}.

## Instructions
${this.currentAgent.instructions}

## Handoff
You can handoff to other agents if the inquiry is better suited for them.
Here are the available agents:
${this.availableAgents.map((x) => x.name).join(', ')}

When you want to handoff to another agent, do NOT speak to the user beforehand,
leave that job to the agent you are handing off to.`

    const exits = () =>
      this.availableAgents.map(
        (agent) =>
          new Exit({
            name: `handoff_${agent.name}`,
            description: `
Handoff to the ${agent.name} agent.
The agent is specialized in:
${agent.description}
Examples of when to handoff to this agent:
${agent.positive_examples.map((ex) => `- ${ex}`).join('\n')}`,
            metadata: {
              type: 'handoff',
              agent: agent.name,
            },
            schema: z.object({
              message: z.string().describe(`reason for handoff to the ${agent.name} agent`),
            }),
          })
      )

    return {
      instructions,
      exits: () => [
        ...exits(),
        new Exit({
          name: 'end_conversation',
          description: 'End the conversation',
        }),
      ],
      tools: async () => await doOrGetValue(this.currentAgent.tools ?? []),
      objects: async () => await doOrGetValue(this.currentAgent.objects ?? []),
      onExit: async (result: ExitResult) => {
        await this.handleHandoffs(result)
      },
    }
  }

  async handleHandoffs(result: ExitResult) {
    const metadata = result.exit.metadata

    if (!isHandoffMetadata(metadata)) {
      this.previousHandoffs = []
      return
    }

    if (this.previousHandoffs.some((x) => x.from === metadata.agent)) {
      throw new Error(
        `You already handed off this request to the ${result.exit.name} agent. Try to either handle it yourself, or handoff to the main again, or ask the user to clarify their request. Previous handoffs: ${JSON.stringify(this.previousHandoffs)}`
      )
    }

    const reason = (result.result as any)?.message || 'No reason provided'
    this.previousHandoffs.push({
      from: this.currentAgent.name,
      to: metadata.agent,
      reason,
    })

    console.log(
      `🔄 Handoff from ${chalk.cyan.bold(this.currentAgent.name)} to ${chalk.green.bold(metadata.agent)} agent. ${chalk.dim('Reason: ' + reason)}`
    )

    this.setCurrentAgent(metadata.agent)
  }
}

export type HandoffMetadata = {
  type: 'handoff'
  agent: string
}

type ControlledContextProps = Pick<
  Parameters<typeof execute>[0],
  'instructions' | 'tools' | 'objects' | 'exits' | 'onExit'
>

const doOrGetValue = async <T>(value: T | ((...args: any) => T) | ((...args: any) => Promise<T>)): Promise<T> => {
  if (typeof value === 'function') {
    return await (value as Function)()
  }

  return value
}

function isHandoffMetadata(metadata: Record<string, any>): metadata is HandoffMetadata {
  return metadata.type === 'handoff' && typeof metadata.agent === 'string'
}
