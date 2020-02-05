import { Button, Classes, Dialog, FormGroup, HTMLSelect, InputGroup, Intent } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { Condition, Test } from '../../shared/typings'

import { TestingAPI } from './api'

interface Props {
  test?: Test
  api: TestingAPI
  visible: boolean
  hide: () => void
  onTestCreated: (test: any) => void
}

const noneIntent = {
  name: 'none',
  slots: []
} as sdk.NLU.IntentDefinition

export const CreateTestModal: FC<Props> = props => {
  const [utterance, setUtterance] = useState<string>((props.test && props.test.utterance) || '')
  const [targetIntent, setEquals] = useState<sdk.NLU.IntentDefinition>(noneIntent)
  const [intents, setIntents] = useState<sdk.NLU.IntentDefinition[]>([])
  const [availableCtx, setAvailableCtxs] = useState([])
  const [selectedCtx, setSelectedCtx] = useState('global')
  const [slotConditions, setSlotConditions] = useState<_.Dictionary<string>>({})

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    props.api.fetchIntents().then(intents => {
      setIntents([...intents, noneIntent])
      const ctxs = _.chain(intents)
        .flatMap(i => i.contexts)
        .uniq()
        .value()
      setAvailableCtxs(ctxs)
      setSelectedCtx(ctxs[0] || 'global')
    })
  }, [])

  const createTest = async e => {
    e.preventDefault()

    const test: Test = {
      id: (props.test && props.test.id) || Date.now().toString(),
      utterance: utterance,
      context: selectedCtx,
      conditions: [
        ['intent', 'is', targetIntent.name],
        ..._.toPairs(slotConditions)
          .filter(([_, value]) => !!value)
          .map(([slotName, value]) => [`slot:${slotName}`, 'is', value])
      ] as Condition[]
    }

    await props.api.updateTest(test)
    setUtterance('')
    props.onTestCreated(test)
    props.hide()
  }

  const targetIntentChanged = e => {
    const intent = intents.find(i => i.name === e.target.value)
    setEquals(intent)
  }

  const selectedCtxChanged = e => {
    setSelectedCtx(e.target.value)
    setEquals(noneIntent)
  }

  const slotConditionChanged = (slotName, e) => {
    setSlotConditions({
      ...slotConditions,
      [slotName]: e.target.value
    })
  }

  return (
    <Dialog title="NLU Tests > New" icon="add" isOpen={props.visible} onClose={props.hide} transitionDuration={0}>
      <form onSubmit={createTest}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Utterance">
            <input
              required
              name="utterance"
              type="text"
              tabIndex={1}
              className={`${Classes.INPUT} ${Classes.FILL}`}
              dir="auto"
              placeholder="Type an utterance here"
              value={utterance}
              onChange={e => setUtterance(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Context" helperText="The context you're currently testing">
            <HTMLSelect
              tabIndex={2}
              fill
              disabled={availableCtx.length < 2}
              options={availableCtx.map(ctx => ({ label: ctx, value: ctx }))}
              onChange={selectedCtxChanged}
              value={selectedCtx}
            />
          </FormGroup>
          <FormGroup label="Intent">
            <HTMLSelect
              tabIndex={3}
              fill
              options={intents
                .filter(i => i.name === 'none' || i.contexts.includes(selectedCtx))
                .map(x => ({ value: x.name, label: x.name }))}
              onChange={targetIntentChanged}
              value={targetIntent.name}
            />
          </FormGroup>
          {targetIntent.slots.map((slot, idx) => (
            <FormGroup key={slot.name} label={`Slot: ${slot.name}`}>
              <InputGroup
                tabIndex={4 + idx}
                placeholder="enter slot source leave empty if absent"
                value={slotConditions[slot.name] || ''}
                onChange={slotConditionChanged.bind(this, slot.name)}
              />
            </FormGroup>
          ))}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type="submit" tabIndex={3} intent={Intent.PRIMARY}>
              Create Test
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
