import { IO, Prompt, PromptConfig, PromptDefinition, PromptNode } from 'botpress/sdk'
import lang from 'common/lang'
import { createMultiLangObject } from 'common/prompts'
import { createForBotpress } from 'core/api'
import { ModuleLoader } from 'core/module-loader'
import { EventRepository } from 'core/repositories'
import { Event } from 'core/sdk/impl'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

import { EventEngine } from '../middleware/event-engine'

import { DialogEngine } from './dialog-engine'
import { ActionStrategy } from './instruction/strategy'
import { getConfirmPromptQuestion, shouldCancelPrompt } from './prompt-utils'

const debugPrompt = DEBUG('dialog:prompt')

// The lost confidence percentage for older messages (index * percent)
const OLD_MESSAGE_CONFIDENCE_DECREASE = 0.15
const MIN_CONFIDENCE_VALIDATION = 0.7
export const MIN_CONFIDENCE_CANCEL = 0.5

@injectable()
export class PromptManager {
  private _prompts!: PromptDefinition[]
  public dialogEngine!: DialogEngine

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ActionStrategy) private actionStrategy: ActionStrategy,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
  ) {}

  @postConstruct()
  public async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY)
    this._prompts = await this.moduleLoader.getPrompts()
  }

  public async promptJumpTo(event: IO.IncomingEvent, destination: { flowName: string; node: string }) {
    const prompt = event.state.context.activePromptStatus

    if (prompt) {
      prompt.stage = 'confirm-jump'
      prompt.state.nextDestination = destination
    }
  }

  // Every prompt adds their output to the temp variable, so it's a reliable check to know ifit's been processed
  public hasCurrentNodeBeenProcessed(event: IO.IncomingEvent) {
    const { context, temp } = event.state
    return context.currentNode && temp[context.currentNode] !== undefined
  }

  // Actions: 'say', 'continue', 'jump', listen'
  public async processPrompt(
    event: IO.IncomingEvent,
    previousEvents: IO.IncomingEvent[]
  ): Promise<{ status: IO.PromptStatus; actions: any[] }> {
    const { context } = event.state
    const s = context.activePromptStatus!

    const slots = event.nlu?.slots ?? {}
    const params = s.configuration
    const varName = params.output

    debugPrompt('before process prompt %o', { prompt: s })

    // TODO: add force-confirm prompt config

    // if ndu.actions = prompt.cancel
    // if ndu.actions = prompt.confirm.yes
    // if ndu.actions = prompt.confirm.no
    // if ndu.actions = prompt.extract
    // if ndu.actions = workflow.start
    // if ndu.actions = question.answer

    const candidates: IO.PromptCandidate[] = []
    const prompt = this.loadPrompt(s.configuration.type, s.configuration)
    const actions: any[] = []

    const tryElect = (value: string): boolean => {
      const { valid, message } = prompt.validate(value)
      if (!valid) {
        actions.push({ type: 'say', message })
      }
      return valid
    }

    if (event.ndu?.actions.find(x => x.action === 'goToNode')) {
      // TODO: can we get rid of goToNode ?
      // TODO: action = prompt.*
    }

    const confirmPrompt = this.loadPrompt('confirm', {})
    const confirmValue = _.chain(confirmPrompt.extraction(event))
      .filter(x => x.confidence >= 0.6) // TODO: confidence
      .orderBy('confidence', 'desc')
      .first()
      .value()

    if (s.stage === 'confirm-cancel') {
      if (event.ndu?.actions?.find(x => x.action === 'prompt.cancel') || confirmValue?.value === true) {
        // TODO: go somewhere else?
        return {
          actions,
          status: {
            ...s,
            status: 'rejected',
            state: {}
          }
        }
      }
    } else if (s.stage === 'confirm-candidate') {
      if (confirmValue?.value === true) {
        if (tryElect(confirmValue.value)) {
          return {
            actions,
            status: {
              ...s,
              status: 'resolved',
              state: {
                value: s.state.confirmCandidate?.value_raw
              }
            }
          }
        } else {
          actions.push({ type: 'say', message: params.question })
          return {
            actions,
            status: {
              ...s,
              stage: 'prompt',
              state: {}
            }
          }
        }
      }
    } else if (s.stage === 'confirm-jump') {
      // TODO: go somewhere else?
      if (confirmValue?.value === true) {
        return {
          actions,
          status: {
            ...s,
            status: 'rejected',
            state: {}
          }
        }
      }
    } else if (s.stage === 'disambiguate-candidates') {
      // TODO: implement this
      // prompt choice
      // if top choice is inside candidates, direct resolve
      // else fallback to filling the prompt
    }

    // if (s.stage === 'new' || s.stage === 'prompt') {
    let eventsToExtractFrom = [event]

    if (s.stage === 'new') {
      eventsToExtractFrom = _.orderBy([event, ...previousEvents], 'id', 'desc')

      const currentVariable = event.state.workflow.variables[varName]
      if (currentVariable?.value !== undefined && currentVariable?.value !== null) {
        if (tryElect(currentVariable.value)) {
          return {
            actions,
            status: {
              ...s,
              status: 'resolved', //
              state: {
                value: (currentVariable as any).value // TODO: bad casting
              }
            }
          }
        }
      }
    }

    const slotCandidate = slots[varName]
    if (slotCandidate?.value !== undefined && slotCandidate?.value !== null) {
      candidates.push({
        confidence: slotCandidate.confidence,
        source: 'slot',
        turns_ago: 0,
        value_raw: slotCandidate.value,
        value_string: slotCandidate?.value.toString() ?? '' // TODO:
      })
    }

    for (const [turn, pastEvent] of eventsToExtractFrom.entries()) {
      const promptCandidates = prompt.extraction(pastEvent)
      for (const candidate of promptCandidates) {
        const candidateValueStr = candidate?.value.toString()
        if (candidates.find(x => x.value_string === candidateValueStr)) {
          // we don't suggest double candidates if older
          continue
        }

        candidates.push({
          confidence: candidate.confidence / promptCandidates.length,
          source: 'prompt',
          turns_ago: turn,
          value_raw: candidate.value,
          value_string: candidate?.value.toString() ?? '' // TODO:
        })
      }
    }

    const shortlistedCandidates = candidates
      .filter(x => x.turns_ago === 0)
      .filter(x => x.confidence >= 0.6) // TODO:
      .filter(x => x.source === 'slot' || s.stage !== 'new')

    if (shortlistedCandidates.length === 1) {
      if (tryElect(shortlistedCandidates[0].value_raw)) {
        return {
          actions,
          status: {
            ...s,
            status: 'resolved',
            state: {
              value: shortlistedCandidates[0].value_raw
            }
          }
        }
      }
    } else if (shortlistedCandidates.length > 1) {
      actions.push({ type: 'say', message: 'DISAMBIGUATE ', candidates: shortlistedCandidates }, { type: 'listen' })
      return {
        actions,
        status: {
          ...s,
          stage: 'disambiguate-candidates',
          state: {
            disambiguateCandidates: shortlistedCandidates
          }
        }
      }
    } else {
      const others = _.chain(candidates)
        .difference(shortlistedCandidates)
        .map(x => ({
          ...x,
          confidence: x.confidence * (1 - 0.15 * x.turns_ago) // TODO:
        }))
        .orderBy(x => x.confidence, 'desc')
        .take(3)
        .value()

      if (others.length === 1) {
        actions.push(
          { type: 'say', message: getConfirmPromptQuestion(params.confirm, others[0].value_raw) },
          { type: 'listen' }
        )
        return {
          actions,
          status: {
            ...s,
            stage: 'confirm-candidate',
            state: {
              confirmCandidate: others[0]
            }
          }
        }
      } else if (others.length > 1) {
        actions.push(
          {
            type: 'say',
            message: { en: `Please choose (${varName}) between ${others.map(x => x.value_raw).join(', ')}  ` },
            candidates: others
          },
          { type: 'listen' }
        )
        return {
          actions,
          status: {
            ...s,
            stage: 'disambiguate-candidates',
            state: {
              disambiguateCandidates: others
            }
          }
        }
      }
    }

    if (event.ndu?.actions.find(x => x.action === 'prompt.cancel')) {
      // TODO: Cancel prompt
      if (params.confirmCancellation) {
        actions.push({ type: 'say', message: lang.tr('module.builtin.prompt.confirmLeaving') }, { type: 'listen' })
        return { actions, status: { ...s, stage: 'confirm-cancel' } }
      } else {
        return { actions, status: { ...s, status: 'rejected' } } // TODO:  go somewhere?
      }
    }

    actions.push({ type: 'say', message: params.question }, { type: 'listen' })
    return { actions, status: { ...s, stage: 'prompt', state: {} } }

    // First turn --> Build candidates
    // from slots (variables)
    // from unconsumed matching entities

    // Subsequent turns --> Amend candidates
    // from unconsumed matching entities

    // PromptStage --> success: confirm, disambiguate, resolve | failure: prompt
    // ConfirmationStage --> success: resolve, reset
    // DisambiguationStage --> success: resolve

    // // Exit the prompt he was stuck there too long
    // else if (status.turns > node?.params?.duration) {
    //   debugPrompt('prompt expired', status.value)
    //   await this._continueOriginalEvent(event)
    // }
  }

  // private async exitPrompt({ event, session, status, highest, isConfidentEnough }) {
  //   const needConfirm = session.prompt?.config?.params?.confirmBeforeCancel

  //   if (!needConfirm) {
  //     await this._continueOriginalEvent(event)
  //     return
  //   }

  //   if (!isConfidentEnough) {
  //     await this._askLeaveConfirmation(event)
  //     return
  //   }

  //   if (highest.extracted === true) {
  //     debugPrompt('leaving prompt')
  //     await this._continueOriginalEvent(event)
  //   } else if (highest.extracted === false) {
  //     status.leaving = false
  //   }
  // }

  private _setCurrentNodeValue(event: IO.IncomingEvent, variable: string, value: any) {
    _.set(event.state.temp, `[${event.state.context.currentNode!}].${variable}`, value)
  }

  // private async _sendCustomPrompt(incomingEvent: IO.IncomingEvent, prompt: Prompt, node: PromptNode): Promise<boolean> {
  //   debugPrompt('sending custom prompt to user')

  //   const promptEvent = Event({
  //     ..._.pick(incomingEvent, ['botId', 'channel', 'target', 'threadId']),
  //     direction: 'outgoing',
  //     type: 'prompt',
  //     payload: node,
  //     incomingEventId: incomingEvent.id
  //   })

  //   const bp = await createForBotpress()
  //   return (await prompt.customPrompt?.(promptEvent, incomingEvent, bp)) ?? false
  // }

  public async processTimeout(event) {
    this._setCurrentNodeValue(event, 'timeout', true)
    return this._continueOriginalEvent(event)
  }

  private async _continueOriginalEvent(event: IO.IncomingEvent) {
    const { originalEvent, status } = event.state.session.prompt!
    const promptEvent = Event(originalEvent as IO.IncomingEvent) as IO.IncomingEvent

    const state = _.omit(event.state, ['session.prompt', 'workflow']) as IO.EventState

    // Must redefine the property since it is removed when omitting
    Object.defineProperty(state, 'workflow', {
      get() {
        return state.session.workflows?.[state.session.currentWorkflow!]
      }
    })

    promptEvent.restored = true
    promptEvent.state = state

    if (status?.nextDestination) {
      const { flowName, node } = status?.nextDestination
      debugPrompt('jumping to location', { flowName, node })
      await this.dialogEngine.jumpTo('', promptEvent, flowName, node)
    }

    await this.eventEngine.sendEvent(promptEvent)
  }

  private loadPrompt(type: string, params: any): Prompt {
    const definition = this._prompts.find(x => x.id === type)
    if (!definition) {
      throw new Error(`Unknown prompt type ${type}`)
    }
    return new definition.prompt(params)
  }
}
