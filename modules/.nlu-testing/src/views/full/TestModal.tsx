import { Button, Classes, Dialog, FormGroup, HTMLSelect, InputGroup, Intent } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { Condition, Test } from '../../shared/typings'

import { TestingAPI } from './api'
import { DEFAULT_TEST_STATE, NONE_CTX, NONE_INTENT, TestModalReducer, TEST_ALL_CTX } from './test-reducer'

interface Props {
  test?: Test
  api: TestingAPI
  visible: boolean
  hide: () => void
  onTestCreated: (test: any) => void
}

const NOTHING_EXPECTED_INTENT = {
  name: '',
  slots: []
}

export const TestModal: FC<Props> = props => {
  const [intents, setIntents] = useState<sdk.NLU.IntentDefinition[]>([])
  const [availableCtx, setAvailableCtxs] = useState([])
  const [state, dispatch] = React.useReducer(TestModalReducer, DEFAULT_TEST_STATE)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    props.api.fetchIntents().then(intents => {
      setIntents([...intents, NONE_INTENT, NOTHING_EXPECTED_INTENT])
      const ctxs = _.chain(intents)
        .flatMap(i => i.contexts)
        .uniq()
        .value()
      setAvailableCtxs([...ctxs, TEST_ALL_CTX, NONE_CTX])
    })
  }, [])

  useEffect(() => {
    const { test } = props

    if (!test && state.utterance !== '') {
      dispatch({ type: 'resetState' })
    }

    if (test) {
      dispatch({ type: 'setStateFromTest', data: { test: props.test, intents } })
    }
  }, [props.test])

  const isEditing = () => !!props.test

  const createTest = async e => {
    e.preventDefault()
    const { expectedCtx, expectedIntent, slotConditions: slotsConds, testingCtx: context, utterance } = state

    const conditions = [
      expectedCtx ? ['context', 'is', expectedCtx] : [],
      expectedIntent?.name ? ['intent', 'is', expectedIntent.name] : [],
      ..._.toPairs(slotsConds)
        .filter(([_, value]) => !!value)
        .map(([slotName, value]) => [`slot:${slotName}`, 'is', value])
    ].filter(c => !_.isEmpty(c)) as Condition[]

    const test: Test = {
      id: isEditing() ? props.test.id : Date.now().toString(),
      utterance,
      context,
      conditions
    }

    await props.api.updateTest(test)
    props.onTestCreated(test)
    props.hide()
  }

  const expectedIntentChanged = e => {
    const intent = intents.find(i => i.name === e.target.value)
    dispatch({ type: 'setExpectedIntent', data: { expectedIntent: intent } })
  }

  const title = isEditing() ? 'Edit test' : 'Create new test'
  const icon = isEditing() ? 'edit' : 'add'

  return (
    <Dialog title={title} icon={icon} isOpen={props.visible} onClose={props.hide} transitionDuration={0}>
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
              value={state.utterance}
              onChange={e => dispatch({ type: 'setUtterance', data: { utterance: e.target.value } })}
            />
          </FormGroup>
          <FormGroup label="Testing Context" helperText="The context you're currently testing">
            <HTMLSelect
              tabIndex={2}
              fill
              disabled={availableCtx.length < 2}
              options={availableCtx.filter(c => c !== 'none').map(ctx => ({ label: ctx, value: ctx }))}
              onChange={e => dispatch({ type: 'setTesingCtx', data: { testingCtx: e.target.value } })}
              value={state.testingCtx}
            />
          </FormGroup>
          {state.testingCtx === TEST_ALL_CTX && (
            <FormGroup label="Expected Context">
              <HTMLSelect
                tabIndex={3}
                fill
                options={availableCtx.filter(c => c !== TEST_ALL_CTX).map(c => ({ value: c, label: c }))}
                onChange={e => dispatch({ type: 'setExpectedCtx', data: { expectedCtx: e.target.value } })}
                value={state.expectedCtx}
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
                    i.name === NOTHING_EXPECTED_INTENT.name ||
                    (state.testingCtx === TEST_ALL_CTX && i.contexts.includes(state.expectedCtx)) ||
                    i.contexts.includes(state.testingCtx)
                )
                .map(x => ({ value: x.name, label: x.name }))
                .uniqBy('value')
                .value()}
              onChange={expectedIntentChanged}
              value={state.expectedIntent?.name ?? ''}
            />
          </FormGroup>
          {state.expectedIntent?.slots.map((slot, idx) => (
            <FormGroup key={slot.name} label={`Slot: ${slot.name}`}>
              <InputGroup
                tabIndex={5 + idx}
                placeholder="enter slot source leave empty if absent"
                value={state.slotConditions[slot.name] || ''}
                onChange={e =>
                  dispatch({ type: 'setSlotCondition', data: { slotName: slot.name, slotValue: e.target.value } })
                }
              />
            </FormGroup>
          ))}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type="submit" tabIndex={3} intent={Intent.PRIMARY}>
              {isEditing() ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
