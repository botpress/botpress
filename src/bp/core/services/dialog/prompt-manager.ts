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
import { getConfirmPromptNode, shouldCancelPrompt } from './prompt-utils'

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
    const prompt = event.state.session.prompt!

    if (prompt.status) {
      prompt.status.exiting = true
      prompt.status.nextDestination = destination
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
    const varName = s.configuration.outputVariableName
    const slots = event.nlu?.slots ?? {}

    debugPrompt('before process prompt %o', { prompt: s })

    // TODO: add force-confirm prompt config

    // if ndu.actions = prompt.cancel
    // if ndu.actions = prompt.confirm.yes
    // if ndu.actions = prompt.confirm.no
    // if ndu.actions = prompt.extract
    // if ndu.actions = workflow.start
    // if ndu.actions = question.answer

    const candidates: IO.PromptCandidate[] = []
    const prompt = this.loadPrompt(s.configuration.promptType, s.configuration.promptParams)
    const actions: any[] = []

    const tryElect = (value: string): boolean => {
      const result = prompt.validate(value)
      if (!result.valid) {
        actions.push({
          type: 'say',
          message: 'invalid (' + result.message + ')'
        })
      }
      return result.valid
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
      if (
        event.ndu?.actions?.find(x => x.action === 'prompt.cancel') ||
        (confirmValue && confirmValue.value === true)
      ) {
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
      if (confirmValue && confirmValue.value === true) {
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
          actions.push({ type: 'say', message: 'RE-PROMPT' })
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
      if (confirmValue && confirmValue.value === true) {
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
        const candidateValueStr = slotCandidate?.value.toString()
        if (candidates.find(x => x.value_string === candidateValueStr)) {
          // we don't suggest double candidates if older
          continue
        }

        candidates.push({
          confidence: candidate.confidence / promptCandidates.length,
          source: 'prompt',
          turns_ago: turn,
          value_raw: candidate.value,
          value_string: slotCandidate?.value.toString() ?? '' // TODO:
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
        actions.push({ type: 'say', message: 'CONFIRM ', candidate: others[0] }, { type: 'listen' })
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
        actions.push({ type: 'say', message: 'DISAMBIGUATE ', candidates: others }, { type: 'listen' })
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
      if (s.configuration.confirmCancellation) {
        actions.push({ type: 'say', message: 'CANCEL ? ' }, { type: 'listen' })
        return { actions, status: { ...s, stage: 'confirm-cancel' } }
      } else {
        return { actions, status: { ...s, status: 'rejected' } } // TODO:  go somewhere?
      }
    }

    actions.push({ type: 'say', message: 'PROMPT ' + s.configuration.promptQuestion }, { type: 'listen' })
    return { actions, status: { ...s, stage: 'prompt', state: {} } }

    // First turn --> Build candidates
    // from slots (variables)
    // from unconsumed matching entities

    // Subsequent turns --> Amend candidates
    // from unconsumed matching entities

    // PromptStage --> success: confirm, disambiguate, resolve | failure: prompt
    // ConfirmationStage --> success: resolve, reset
    // DisambiguationStage --> success: resolve

    // const node: PromptNode = session.prompt!.config
    // const { minConfidence, prompt } = this._getPrompt(node, event)

    // const extractedVars = await this.evaluateEventVariables(previousEvents, prompt)
    // const highest = _.orderBy(extractedVars, 'confidence', 'desc')[0] ?? { confidence: 0, extracted: undefined }

    // debugPrompt('before processing %o', { highest })

    // const status: IO.PromptStatus = session.prompt?.status || { turns: 0 }
    // const needValidation = status.turns === 0 || highest.confidence <= MIN_CONFIDENCE_VALIDATION
    // const isConfidentEnough = highest.confidence > 0 && (!minConfidence || highest.confidence >= minConfidence)

    // if (shouldCancelPrompt(event)) {
    //   debugPrompt('user wish to cancel the prompt')

    //   this._setCurrentNodeValue(event, 'cancelled', true)
    //   status.exiting = true
    // }

    // if (status.exiting) {
    //   await this.exitPrompt({ event, session, status, highest, isConfidentEnough })
    // }

    // // Confirming the value
    // else if (status.confirming) {
    //   if (isConfidentEnough && highest.extracted === true) {
    //     status.extracted = true
    //   } else {
    //     status.value = undefined
    //     status.confirming = false

    //     await this._askQuestion(event, this.loadPrompt(node).prompt, node)
    //   }
    // }

    // // We're confident enough about the value, but need to confirm
    // else if (isConfidentEnough && needValidation) {
    //   status.value = highest.extracted
    //   status.confirming = true

    //   await this._askConfirmation(event, highest.extracted, node)
    // }

    // // If confident enough OR if the value was validated....
    // else if (isConfidentEnough && !needValidation) {
    //   status.value = highest.extracted
    //   status.extracted = true
    // }

    // // We already processed the previous events, the user sent a response and it doesn't match. We explain why
    // else if (!isConfidentEnough && status.turns > 0) {
    //   await this._explainPromptError(event, prompt, highest.extracted)
    // }

    // // Ask the question to the user, only if we could not extract it
    // else if (!status.questionAsked) {
    //   status.questionAsked = true

    //   await this._askQuestion(event, prompt, node)
    // }

    // status.turns++

    // session.prompt = {
    //   ...session.prompt,
    //   evaluation: extractedVars,
    //   status
    // } as IO.ActivePrompt

    // if (status.extracted) {
    //   debugPrompt('successfully extracted!', status.value)
    //   this._setCurrentNodeValue(event, 'extracted', true)

    //   const { valueType } = this.loadPrompt(node)
    //   event.state.setVariable(node.params.output, status.value, valueType ?? '')

    //   await this._continueOriginalEvent(event)
    // }

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

  // private async _explainPromptError(event: IO.IncomingEvent, prompt: Prompt, value: any) {
  //   const { valid, message } = await prompt.validate(value)
  //   debugPrompt('provided answer doesnt match, explain error %o', { valid, message })

  //   await this.actionStrategy.invokeSendMessage(
  //     createMultiLangObject(message!, 'text', { typing: true }),
  //     '@builtin_text',
  //     event
  //   )
  // }

  // private async _askQuestion(event: IO.IncomingEvent, prompt: Prompt, node: PromptNode) {
  //   debugPrompt('ask prompt question')

  //   if (!prompt.customPrompt || !this._sendCustomPrompt(event, prompt, node)) {
  //     await this.actionStrategy.invokeSendMessage(
  //       createMultiLangObject(node.params.question, 'text', { typing: true }),
  //       '@builtin_text',
  //       event
  //     )
  //   }
  // }

  // private async _askLeaveConfirmation(event: IO.IncomingEvent) {
  //   debugPrompt('ask validation before leaving prompt')

  //   const confirmNode = {
  //     type: 'confirm',
  //     params: {
  //       output: 'confirmed',
  //       question: lang.tr('module.builtin.prompt.confirmLeaving')
  //     }
  //   }

  //   // const promptConfirm = this.loadPrompt(confirmNode).prompt
  //   // await this._sendCustomPrompt(event, promptConfirm, confirmNode)
  // }

  // private async _askConfirmation(event: IO.IncomingEvent, value: any, node: PromptNode) {
  //   debugPrompt('low confidence, asking validation for %o', { value: value, output: node.params.output })

  //   const confirmNode = getConfirmPromptNode(node, value)
  //   const promptConfirm = this.loadPrompt(confirmNode).prompt
  //   await this._sendCustomPrompt(event, promptConfirm, confirmNode)
  // }

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

  // private async evaluateEventVariables(
  //   events: IO.IncomingEvent[],
  //   prompt: Prompt
  // ): Promise<{ confidence: number; extracted: any }[]> {
  //   return Promise.mapSeries(events, async (event, idx) => {
  //     const { value, confidence } = prompt.extraction(event) || {}
  //     const { valid } = (await prompt.validate(value)) || {}
  //     const finalConfidence = +!!valid * (confidence ?? 0) * (1 - idx * OLD_MESSAGE_CONFIDENCE_DECREASE)

  //     debugPrompt('variable extraction %o', { preview: event.preview, valid, value, finalConfidence })

  //     return { confidence: finalConfidence ?? 0, extracted: value }
  //   })
  // }
}
