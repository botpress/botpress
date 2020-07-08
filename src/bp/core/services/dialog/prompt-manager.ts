import { IO, Prompt, PromptDefinition } from 'botpress/sdk'
import { MultiLangText } from 'botpress/sdk'
import lang from 'common/lang'
import { injectable } from 'inversify'
import _ from 'lodash'

const debugPrompt = DEBUG('dialog:prompt')

// The lost confidence percentage for older messages (index * percent)
const CONF_CHURN_BY_TURN = 0.15
const MIN_CONFIDENCE_VALIDATION = 0.7

type ProcessedStatus = { status: IO.PromptStatus; actions: any[] }

const getConfirmPromptPayload = (messages: MultiLangText | undefined, value: any) => {
  let question = lang.tr('module.builtin.prompt.confirmValue', { value })

  if (messages) {
    question = _.mapValues(messages, (q, lang) => (q.length > 0 ? q.replace(`$value`, value) : question[lang]))
  }

  return { type: 'confirm', question }
}

const generateCancellation = (actions: any[], status: IO.PromptStatus): ProcessedStatus => {
  if (status.config.confirmCancellation) {
    actions.push({ type: 'say', message: lang.tr('module.builtin.prompt.confirmLeaving') }, { type: 'listen' })
    return { actions, status: { ...status, stage: 'confirm-cancel' } }
  } else {
    return generateRejected(actions, status, 'cancelled')
  }
}

const generateJumpTo = (actions: any[], status: IO.PromptStatus): ProcessedStatus => {
  if (status.config.confirmCancellation) {
    actions.push({ type: 'say', message: lang.tr('module.builtin.prompt.confirmLeaving') }, { type: 'listen' })
    return { actions, status: { ...status, stage: 'confirm-jump' } }
  } else {
    return generateRejected(actions, status, 'jumped')
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
  actions.push({ type: 'say', payload: status.config, eventType: 'prompt' }, { type: 'listen' })

  return {
    actions,
    status: {
      ...status,
      questionAsked: true,
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
        question: status.config.question,
        items: candidates.map(x => ({ label: x.value_string, value: x.value_string }))
      },
      eventType: 'prompt'
    },
    { type: 'listen' }
  )
  return {
    actions,
    status: {
      ...status,
      questionAsked: true,
      stage: 'disambiguate-candidates',
      state: {
        disambiguateCandidates: candidates
      }
    }
  }
}

const generateCandidate = (actions: any[], status: IO.PromptStatus, candidate: IO.PromptCandidate): ProcessedStatus => {
  if (!status.questionAsked) {
    actions.push({ type: 'say', message: status.config.question })
  }

  actions.push(
    { type: 'say', payload: getConfirmPromptPayload(status.config.confirm, candidate.value_raw), eventType: 'prompt' },
    { type: 'listen' }
  )

  return {
    actions,
    status: {
      ...status,
      stage: 'confirm-candidate',
      questionAsked: true,
      state: {
        confirmCandidate: candidate
      }
    }
  }
}

@injectable()
export class PromptManager {
  public prompts!: PromptDefinition[]

  public async processPrompt(
    event: IO.IncomingEvent,
    previousEvents: IO.IncomingEvent[]
  ): Promise<{ status: IO.PromptStatus; actions: IO.DialogAction[] }> {
    const { context } = event.state
    const status = context.activePrompt!

    const slots = _.omitBy(_.get(event.state.session, 'slots', {}), x => x.elected)
    const params = status.config
    const varName = params.output

    debugPrompt('before process prompt %o', { prompt: status })

    const candidates: IO.PromptCandidate[] = []
    const prompt = this.loadPrompt(status.config.type, status.config)
    const actions: IO.DialogAction[] = []

    const tryElect = (value: any): boolean => {
      const { valid, message } = prompt.validate(value)
      if (!valid) {
        actions.push({ type: 'say', message: message || 'THIS IS THE BUG' })
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
        if (tryElect(status.state.confirmCandidate?.value_raw)) {
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
      .filter(x => x.confidence > 0)
      .orderBy(x => x.confidence, 'desc')
      .take(3)
      .value()

    if (shortlisted.length === 1) {
      if (tryElect(shortlisted[0].value_raw)) {
        if (shortlisted[0].source === 'slot') {
          this._electSlot(event, varName)
        }
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

    if (status.stage === 'confirm-jump') {
      return generateJumpTo(actions, status)
    }

    return generatePrompt(actions, status)
  }

  private _setCurrentNodeValue(event: IO.IncomingEvent, variable: string, value: any) {
    // TODO: move to dialog engine
    _.set(event.state.temp, `[${event.state.context.currentNode!}].${variable}`, value)
  }

  private _electSlot(event: IO.IncomingEvent, slotName: string) {
    _.set(event.state.session, `slots.${slotName}.elected`, true)
  }

  public async processTimeout(event) {
    // TODO: move to dialog engine
    this._setCurrentNodeValue(event, 'timeout', true)
    return event
  }

  private loadPrompt(type: string, params: any): Prompt {
    const definition = this.prompts.find(x => x.id === type)
    if (!definition) {
      throw new Error(`Unknown prompt type ${type}`)
    }
    return new definition.prompt(params)
  }
}
