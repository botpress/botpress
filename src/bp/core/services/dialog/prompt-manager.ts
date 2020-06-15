import { IO, Prompt, PromptConfig, PromptNode } from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
import { createForBotpress } from 'core/api'
import { EventRepository } from 'core/repositories'
import { Event } from 'core/sdk/impl'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { CMSService } from '../cms'
import { EventEngine } from '../middleware/event-engine'

import { ActionStrategy } from './instruction/strategy'
import PromptConfirm from './prompts/confirm'
import PromptDate from './prompts/date'

const prompts = [PromptDate, PromptConfirm]

const debugPrompt = DEBUG('dialog:prompt')

// The lost confidence percentage for older messages (index * percent)
const OLD_MESSAGE_CONFIDENCE_DECREASE = 0.15
const MIN_CONFIDENCE_VALIDATION = 0.7

const buildMessage = (messagesByLang: { [lang: string]: string }, text?: string) => {
  return Object.keys(messagesByLang || {}).reduce((acc, lang) => {
    acc[`markdown$${lang}`] = true
    acc[`typing$${lang}`] = true
    acc[`text$${lang}`] = `${messagesByLang[lang]}${text ? `: ${text}` : ''}`
    return acc
  }, {})
}

// TODO backend translations
const getConfirmationQuestion = value => {
  return {
    en: `Is that value correct?: ${value}`,
    fr: `Est-ce que cette valeur est correcte?: ${value}`
  }
}

const getConfirmPromptNode = (node: PromptNode, value: any): PromptNode => {
  const question = buildMessage(node.confirm || getConfirmationQuestion(value))
  return {
    type: 'confirm',
    output: 'confirmed',
    question,
    params: { question }
  }
}

export const isPromptEvent = (event: IO.IncomingEvent): boolean => {
  return !!(event.prompt || event.state?.session?.prompt || (event.type === 'prompt' && event.direction === 'incoming'))
}

@injectable()
export class PromptManager {
  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.EventRepository) private eventRepository: EventRepository,
    @inject(TYPES.ActionStrategy) private actionStrategy: ActionStrategy
  ) {}

  public async processPrompt(event: IO.IncomingEvent) {
    const { session } = event.state
    const events: IO.IncomingEvent[] = await this._getLastEvents(event)

    // It's the first event, setup the prompt
    if (event.prompt) {
      session.prompt = {
        config: event.prompt,
        originalEvent: _.omit(event, ['state'])
      }
      delete event.prompt
    }

    const node: PromptNode = session.prompt!.config
    const { minConfidence, prompt } = this._getPrompt(node, event)

    const extractedVars = await this.evaluateEventVariables(events, prompt)
    const highest = _.orderBy(extractedVars, 'confidence', 'desc')[0]

    debugPrompt('before processing %o', { highest })

    const needValidation = highest.confidence <= MIN_CONFIDENCE_VALIDATION
    const isConfidentEnough = highest.confidence > 0 && (!minConfidence || highest.confidence >= minConfidence)

    const status: IO.PromptStatus = session.prompt?.status || { turns: 0 }

    if (status.confirming) {
      if (isConfidentEnough && highest.extracted === true) {
        status.extracted = true
      } else {
        status.value = undefined
        status.confirming = false

        await this._askQuestion(event, this.loadPrompt(node).prompt, node)
      }
    }

    // We're confident enough about the value, but need to confirm
    else if (isConfidentEnough && needValidation) {
      status.value = highest.extracted
      status.confirming = true

      await this._askConfirmation(event, highest.extracted, node)
    }

    // If confident enough OR if the value was validated....
    else if (isConfidentEnough && !needValidation) {
      status.value = highest.extracted
      status.extracted = true
    }

    // We already processed the previous events, the user sent a response and it doesn't match. We explain why
    else if (!isConfidentEnough && status.turns > 0) {
      await this._explainPromptError(event, prompt, highest.extracted)
    }

    // Ask the question to the user, only if we could not extract it
    else if (!status.questionAsked) {
      status.questionAsked = true

      await this._askQuestion(event, prompt, node)
    }

    status.turns++

    session.prompt = {
      ...session.prompt,
      evaluation: extractedVars,
      status
    } as IO.ActivePrompt

    if (status.extracted) {
      debugPrompt('successfully extracted!', status.value)

      // TODO save the variable
      //  event.state.setVariable(node.output, highest.extracted, valueType!)

      await this._continueOriginalEvent(event)
    }
  }

  private async _explainPromptError(event: IO.IncomingEvent, prompt: Prompt, value: any) {
    const { valid, message } = await prompt.validate(value)
    debugPrompt('provided answer doesnt match, explain error %o', { valid, message })

    await this.actionStrategy.invokeSendMessage(buildMessage({ en: message! }), '@builtin_text', event)
  }

  private async _askQuestion(event: IO.IncomingEvent, prompt: Prompt, node: PromptNode) {
    debugPrompt('ask prompt question')

    if (prompt.customPrompt) {
      await this._sendCustomPrompt(event, prompt, node)
    } else {
      await this.actionStrategy.invokeSendMessage(buildMessage(node.question), '@builtin_text', event)
    }
  }

  private async _askConfirmation(event: IO.IncomingEvent, value: any, node: PromptNode) {
    debugPrompt('low confidence, asking validation for %o', { value: value, output: node.output })

    const confirmNode = getConfirmPromptNode(node, value)
    await this._sendCustomPrompt(event, new PromptConfirm(confirmNode), confirmNode)
  }

  private async _sendCustomPrompt(incomingEvent: IO.IncomingEvent, prompt: Prompt, node: PromptNode) {
    debugPrompt('sending custom prompt to user')

    const promptEvent = Event({
      ..._.pick(incomingEvent, ['botId', 'channel', 'target', 'threadId']),
      direction: 'outgoing',
      type: 'prompt',
      payload: node,
      incomingEventId: incomingEvent.id
    })

    const bp = await createForBotpress()
    await prompt.customPrompt?.(promptEvent, incomingEvent, bp)

    await this.eventEngine.sendEvent(promptEvent)
  }

  private async _continueOriginalEvent(event: IO.IncomingEvent) {
    const { originalEvent } = event.state.session.prompt!
    const promptEvent = Event(originalEvent as IO.IncomingEvent) as IO.IncomingEvent

    promptEvent.restored = true
    promptEvent.state = _.omit(event.state, ['session.prompt']) as IO.EventState

    await this.eventEngine.sendEvent(promptEvent)
  }

  /** Returns the last 6 events if it's the first time the prompt is executed */
  private async _getLastEvents(event: IO.IncomingEvent): Promise<IO.IncomingEvent[]> {
    if (event.state.session.prompt) {
      return [event]
    }

    const lastEvents: IO.StoredEvent[] = await this.eventRepository.findEvents(
      { direction: 'incoming', target: event.target },
      { count: 5, sortOrder: [{ column: 'createdOn', desc: true }] }
    )

    return lastEvents.map(x => x.event as IO.IncomingEvent)
  }

  private _getPrompt(node: PromptNode, event: IO.IncomingEvent) {
    const status = event.state.session?.prompt?.status

    return this.loadPrompt(status?.confirming ? getConfirmPromptNode(node, status?.value) : node)
  }

  private loadPrompt(promptNode: PromptNode): { prompt: Prompt } & PromptConfig {
    const promptClass = prompts.find(x => x.config.type === promptNode.type)
    if (!promptClass) {
      throw new Error(`Unknown prompt type ${promptNode.type}`)
    }

    const prompt = new promptClass(promptNode.params as any)
    return { prompt, ...promptClass.config }
  }

  private async evaluateEventVariables(
    events: IO.IncomingEvent[],
    prompt: Prompt
  ): Promise<{ confidence: number; extracted: any }[]> {
    return Promise.mapSeries(events, async (event, idx) => {
      const { value, confidence } = prompt.extraction(event) || {}
      const { valid } = (await prompt.validate(value)) || {}
      const finalConfidence = +!!valid * (confidence ?? 0) * (1 - idx * OLD_MESSAGE_CONFIDENCE_DECREASE)

      debugPrompt('variable extraction %o', { preview: event.preview, valid, value, finalConfidence })

      return { confidence: finalConfidence ?? 0, extracted: value }
    })
  }
}
