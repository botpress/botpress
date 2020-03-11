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
  const [expectedIntent, setTargetIntent] = useState<sdk.NLU.IntentDefinition>(noneIntent)
  const [intents, setIntents] = useState<sdk.NLU.IntentDefinition[]>([])
  const [availableCtx, setAvailableCtxs] = useState([])
  const [testingCtx, setTestingCtx] = useState('*')
  const [slotConditions, setSlotConditions] = useState<_.Dictionary<string>>({})
  const [expectedCtx, setExpectedCtx] = useState<string>('')

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    props.api.fetchIntents().then(intents => {
      setIntents([...intents, noneIntent])
      const ctxs = _.chain(intents)
        .flatMap(i => i.contexts)
        .uniq()
        .value()
      setAvailableCtxs([...ctxs, '*', 'none'])
      setExpectedCtx(ctxs[0])
    })
  }, [])

  const createTest = async e => {
    e.preventDefault()

    const test: Test = {
      id: (props.test && props.test.id) || Date.now().toString(),
      utterance: utterance,
      context: testingCtx,
      conditions: [
        ['intent', 'is', expectedIntent.name],
        ['context', 'is', expectedCtx],
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

  const expectedIntentChanged = e => {
    const intent = intents.find(i => i.name === e.target.value)
    setTargetIntent(intent)
  }

  const testingCtxChanged = e => {
    setTestingCtx(e.target.value)
    setTargetIntent(noneIntent)
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
          <FormGroup label="Testing Context" helperText="The context you're currently testing">
            <HTMLSelect
              tabIndex={2}
              fill
              disabled={availableCtx.length < 2}
              options={availableCtx.filter(c => c !== 'none').map(ctx => ({ label: ctx, value: ctx }))}
              onChange={testingCtxChanged}
              value={testingCtx}
            />
          </FormGroup>
          {testingCtx === '*' && (
            <FormGroup label="Expected Context">
              <HTMLSelect
                tabIndex={3}
                fill
                options={availableCtx.filter(c => c !== '*').map(c => ({ value: c, label: c }))}
                onChange={e => setExpectedCtx(e.target.value)}
                value={expectedCtx}
              />
            </FormGroup>
          )}
          <FormGroup label="Expected Intent">
            <HTMLSelect
              tabIndex={4}
              fill
              options={_.chain(intents)
                .filter(
                  i =>
                    i.name === 'none' ||
                    (testingCtx === '*' && i.contexts.includes(expectedCtx)) ||
                    i.contexts.includes(testingCtx)
                )
                .map(x => ({ value: x.name, label: x.name }))
                .uniq()
                .value()}
              onChange={expectedIntentChanged}
              value={expectedIntent.name}
            />
          </FormGroup>
          {expectedIntent.slots.map((slot, idx) => (
            <FormGroup key={slot.name} label={`Slot: ${slot.name}`}>
              <InputGroup
                tabIndex={5 + idx}
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
