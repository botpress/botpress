import { IO, Prompt, PromptDefinition } from 'botpress/sdk'
import lang from 'common/lang'
import { ModuleLoader } from 'core/module-loader'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

import { getConfirmPromptPayload } from './prompt-utils'

const debugPrompt = DEBUG('dialog:prompt')

// The lost confidence percentage for older messages (index * percent)
const CONF_CHURN_BY_TURN = 0.15
const MIN_CONFIDENCE_VALIDATION = 0.7

type ProcessedStatus = { status: IO.PromptStatus; actions: any[] }

const generateCancellation = (actions: any[], status: IO.PromptStatus): ProcessedStatus => {
  if (status.configuration.confirmCancellation) {
    actions.push({ type: 'say', message: lang.tr('module.builtin.prompt.confirmLeaving') }, { type: 'listen' })
    return { actions, status: { ...status, stage: 'confirm-cancel' } }
  } else {
    return generateRejected(actions, status, 'cancelled')
  }
}

const generateResolved = (actions: any[], status: IO.PromptStatus, value: any): ProcessedStatus => {
  return {
    actions,
    status: {
      ...status,
      status: 'resolved',
      state: { value }
    }
  }
}

const generatePrompt = (actions: any[], status: IO.PromptStatus): ProcessedStatus => {
  actions.push({ type: 'say', payload: status.configuration }, { type: 'listen' })

  return {
    actions,
    status: {
      ...status,
      stage: 'prompt',
      state: {}
    }
  }
}

const generateRejected = (
  actions: any[],
  status: IO.PromptStatus,
  reason: 'cancelled' | 'timedout' | 'jumped'
): ProcessedStatus => {
  return {
    actions,
    status: {
      ...status,
      status: 'rejected',
      rejection: reason,
      state: { nextDestination: status.state.nextDestination }
    }
  }
}

const generateDisambiguate = (
  actions: any[],
  status: IO.PromptStatus,
  candidates: IO.PromptCandidate[]
): ProcessedStatus => {
  actions.push(
    {
      type: 'say',
      payload: {
        type: 'enum',
        question: status.configuration.question,
        items: candidates.map(x => ({ label: x.value_string, value: x.value_string })),
        metadata: { __usePicker: true }
      }
    },
    { type: 'listen' }
  )
  return {
    actions,
    status: {
      ...status,
      stage: 'disambiguate-candidates',
      state: {
        disambiguateCandidates: candidates
      }
    }
  }
}

const generateCandidate = (actions: any[], status: IO.PromptStatus, candidate: IO.PromptCandidate): ProcessedStatus => {
  actions.push(
    { type: 'say', payload: getConfirmPromptPayload(status.configuration.confirm, candidate.value_raw) },
    { type: 'listen' }
  )
  return {
    actions,
    status: {
      ...status,
      stage: 'confirm-candidate',
      state: {
        confirmCandidate: candidate
      }
    }
  }
}

@injectable()
export class PromptManager {
  private _prompts!: PromptDefinition[]

  constructor(@inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader) {}

  @postConstruct()
  public async init() {
    // TODO: get rid of this dependency
    // probably inject the list of possible prompts directly instead (PromptRegistry?)
    await AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY)
    this._prompts = await this.moduleLoader.getPrompts()
  }

  public async promptJumpTo(event: IO.IncomingEvent, destination: { flowName: string; node: string }) {
    const prompt = event.state.context.activePromptStatus
    // look at NDU events
    if (prompt) {
      prompt.stage = 'confirm-jump'
      prompt.state.nextDestination = destination
    }
  }

  public async processPrompt(
    event: IO.IncomingEvent,
    previousEvents: IO.IncomingEvent[]
  ): Promise<{ status: IO.PromptStatus; actions: any[] }> {
    const { context } = event.state
    const status = context.activePromptStatus!

    const slots = event.nlu?.slots ?? {}
    const params = status.configuration
    const varName = params.output

    debugPrompt('before process prompt %o', { prompt: status })

    const candidates: IO.PromptCandidate[] = []
    const prompt = this.loadPrompt(status.configuration.type, status.configuration)
    const actions: any[] = []

    const tryElect = (value: string): boolean => {
      const { valid, message } = prompt.validate(value)
      if (!valid) {
        actions.push({ type: 'say', message })
      }
      return valid
    }

    const confirmPrompt = this.loadPrompt('confirm', {})
    const confirmValue = _.chain(confirmPrompt.extraction(event))
      .filter(x => x.confidence >= MIN_CONFIDENCE_VALIDATION)
      .orderBy('confidence', 'desc')
      .first()
      .value()

    if (status.stage === 'confirm-cancel') {
      if (event.ndu?.actions?.find(x => x.action === 'prompt.cancel') || confirmValue?.value === true) {
        this._setCurrentNodeValue(event, 'cancelled', true) // TODO: move this to engine instead
        return generateRejected(actions, status, 'cancelled')
      }
    }

    if (status.stage === 'confirm-candidate') {
      if (confirmValue?.value === true) {
        if (tryElect(confirmValue.value)) {
          return generateResolved(actions, status, status.state.confirmCandidate?.value_raw)
        } else {
          return generatePrompt(actions, status)
        }
      }
    }

    if (status.stage === 'confirm-jump') {
      if (confirmValue?.value === true) {
        return generateRejected(actions, status, 'jumped')
      }
    }

    if (status.stage === 'disambiguate-candidates') {
      // TODO: implement this
      // prompt choice
      // if top choice is inside candidates, direct resolve
      // else fallback to filling the prompt
    }

    let eventsToExtractFrom = [event]

    if (status.stage === 'new') {
      eventsToExtractFrom = _.orderBy([event, ...previousEvents], 'id', 'desc')

      const currentVariable = event.state.workflow.variables[varName]
      if (currentVariable?.value !== undefined && currentVariable?.value !== null) {
        if (tryElect(currentVariable.value)) {
          return generateResolved(actions, status, (currentVariable as any).value)
        }
      }
    }

    const slotCandidate = slots[varName]
    if (slotCandidate?.value !== undefined && slotCandidate?.value !== null) {
      // TODO: remove slots already elected
      candidates.push({
        confidence: slotCandidate.confidence,
        source: 'slot',
        turns_ago: 0,
        value_raw: slotCandidate.value,
        value_string: slotCandidate?.value.toString() ?? slotCandidate.value
      })
    }

    for (const [turn, pastEvent] of eventsToExtractFrom.entries()) {
      const promptCandidates = prompt.extraction(pastEvent)
      for (const candidate of promptCandidates) {
        const candidateValueStr = candidate?.value.toString()
        if (candidates.find(x => x.value_string === candidateValueStr)) {
          continue // we don't suggest double candidates if older
        }

        candidates.push({
          confidence: candidate.confidence / promptCandidates.length,
          source: 'prompt',
          turns_ago: turn,
          value_raw: candidate.value,
          value_string: candidate?.value.toString() ?? candidate.value
        })
      }
    }

    const shortlisted = candidates
      .filter(x => x.turns_ago === 0)
      .filter(x => x.confidence >= MIN_CONFIDENCE_VALIDATION)
      .filter(x => x.source === 'slot' || status.stage !== 'new')

    const others = _.chain(candidates)
      .difference(shortlisted)
      .map(x => ({
        ...x,
        confidence: x.confidence * (1 - CONF_CHURN_BY_TURN * x.turns_ago)
      }))
      .orderBy(x => x.confidence, 'desc')
      .take(3)
      .value()

    if (shortlisted.length === 1) {
      if (tryElect(shortlisted[0].value_raw)) {
        return generateResolved(actions, status, shortlisted[0].value_raw)
      }
    } else if (shortlisted.length > 1) {
      return generateDisambiguate(actions, status, shortlisted)
    } else {
      if (others.length === 1) {
        return generateCandidate(actions, status, others[0])
      } else if (others.length > 1) {
        return generateDisambiguate(actions, status, others)
      }
    }

    if (event.ndu?.actions.find(x => x.action === 'prompt.cancel')) {
      return generateCancellation(actions, status)
    }

    return generatePrompt(actions, status)
  }

  private _setCurrentNodeValue(event: IO.IncomingEvent, variable: string, value: any) {
    // TODO: move to dialog engine
    _.set(event.state.temp, `[${event.state.context.currentNode!}].${variable}`, value)
  }

  public async processTimeout(event) {
    // TODO: move to dialog engine
    this._setCurrentNodeValue(event, 'timeout', true)
    return event
  }

  private loadPrompt(type: string, params: any): Prompt {
    // TODO: move to PromptRegistry
    const definition = this._prompts.find(x => x.id === type)
    if (!definition) {
      throw new Error(`Unknown prompt type ${type}`)
    }
    return new definition.prompt(params)
  }
}
