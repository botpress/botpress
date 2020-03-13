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

const TEST_ALL_CTX = '*'
const NONE_CTX = 'none'
const NONE_INTENT = {
  name: 'none',
  slots: []
} as sdk.NLU.IntentDefinition

export const TestModal: FC<Props> = props => {
  const [utterance, setUtterance] = useState<string>((props.test && props.test.utterance) || '')
  const [expectedIntent, setExpectedIntent] = useState<sdk.NLU.IntentDefinition>(NONE_INTENT)
  const [intents, setIntents] = useState<sdk.NLU.IntentDefinition[]>([])
  const [availableCtx, setAvailableCtxs] = useState([])
  const [testingCtx, setTestingCtx] = useState('*')
  const [slotConditions, setSlotConditions] = useState<_.Dictionary<string>>({})
  const [expectedCtx, setExpectedCtx] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    props.api.fetchIntents().then(intents => {
      setIntents([...intents, NONE_INTENT])
      const ctxs = _.chain(intents)
        .flatMap(i => i.contexts)
        .uniq()
        .value()
      setAvailableCtxs([...ctxs, TEST_ALL_CTX, NONE_CTX])
      setExpectedCtx(ctxs[0])
    })
  }, [])

  useEffect(() => {
    const { test } = props
    setIsEditing(!!test)

    if (!test && utterance !== '') {
      setUtterance('')
      setTestingCtx(TEST_ALL_CTX)
      setExpectedCtx(NONE_CTX)
      setExpectedIntent(NONE_INTENT)
      setSlotConditions({})
    }

    if (test) {
      setStateFromTest(test)
    }
  }, [props.test])

  const setStateFromTest = (test: Test) => {
    setUtterance(test.utterance)
    setTestingCtx(test.context)

    if (test.context === TEST_ALL_CTX) {
      const ctxCondition = test.conditions.find(([key]) => key === 'context')
      
      setExpectedCtx(ctxCondition[2])
    }

    const intentCondition = test.conditions.find(([key]) => key === 'intent')
    const expectedIntent = intents.find(i => i.name === intentCondition[2])
    
    setExpectedIntent(expectedIntent)

    const expectedSlots = test.conditions
      .filter(([key]) => key.startsWith('slot'))
      .reduce((slotsDic, [key, is, slotValue]) => {
        const slotName = key.split(':')[1]
        slotsDic[slotName] = slotValue
        return slotsDic
      }, {})
    setSlotConditions(expectedSlots)
  }

  const createTest = async e => {
    e.preventDefault()

    const test: Test = {
      id: isEditing ? props.test.id : Date.now().toString(),
      utterance: utterance,
      context: testingCtx,
      conditions: [
        ['context', 'is', expectedCtx],
        ['intent', 'is', expectedIntent.name],
        ..._.toPairs(slotConditions)
          .filter(([_, value]) => !!value)
          .map(([slotName, value]) => [`slot:${slotName}`, 'is', value])
      ] as Condition[]
    }

    await props.api.updateTest(test)
    props.onTestCreated(test)
    props.hide()
  }

  const expectedIntentChanged = e => {
    const intent = intents.find(i => i.name === e.target.value)
    setExpectedIntent(intent)
  }

  const testingCtxChanged = e => {
    setTestingCtx(e.target.value)
    setExpectedIntent(NONE_INTENT)
  }

  const slotConditionChanged = (slotName, e) => {
    setSlotConditions({
      ...slotConditions,
      [slotName]: e.target.value
    })
  }

  return (
    <Dialog
      title={isEditing ? 'Edit test' : 'Create new test'}
      icon={isEditing ? 'edit' : 'add'}
      isOpen={props.visible}
      onClose={props.hide}
      transitionDuration={0}
    >
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
          {testingCtx === TEST_ALL_CTX && (
            <FormGroup label="Expected Context">
              <HTMLSelect
                tabIndex={3}
                fill
                options={availableCtx.filter(c => c !== TEST_ALL_CTX).map(c => ({ value: c, label: c }))}
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
                    i.name === NONE_INTENT.name ||
                    (testingCtx === TEST_ALL_CTX && i.contexts.includes(expectedCtx)) ||
                    i.contexts.includes(testingCtx)
                )
                .map(x => ({ value: x.name, label: x.name }))
                .uniqBy('value')
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
              {isEditing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
