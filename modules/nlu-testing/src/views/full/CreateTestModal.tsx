import { Button, Classes, Dialog, FormGroup, HTMLSelect, Intent } from '@blueprintjs/core'
import React, { FC, useEffect, useRef, useState } from 'react'

import { Test, TestingAPI } from './api'

interface Props {
  test?: Test
  api: TestingAPI
  visible: boolean
  hide: () => void
  onTestCreated: (test: any) => void
}

export const CreateTestModal: FC<Props> = props => {
  const [utterance, setUtterance] = useState<string>((props.test && props.test.utterance) || '')
  const [equals, setEquals] = useState<string>('none')
  const [intents, setIntents] = useState<string[]>([])
  const [isValid, setIsValid] = useState<boolean>(false)
  const utteranceInput = useRef(null)

  const fetchIntents = () => {
    return props.api.fetchIntents().then(intents => {
      setIntents([...intents.map(x => x.name), 'none'])
      setEquals('none')
    })
  }

  if (!intents.length) {
    fetchIntents()
  }

  useEffect(() => {
    setIsValid(utterance.trim().length > 0)
  }, [utterance, equals])

  const createTest = async e => {
    e.preventDefault()

    const test: Test = {
      id: (props.test && props.test.id) || Date.now().toString(),
      utterance: utterance,
      condition: ['intent', 'is', equals]
    }

    await props.api.updateTest(test)
    setUtterance('')
    setEquals('')
    props.onTestCreated(test)
    props.hide()
  }

  return (
    <Dialog
      title="NLU Tests > New"
      icon="add"
      isOpen={props.visible}
      onClose={props.hide}
      onOpened={() => utteranceInput.current.focus()}
      transitionDuration={0}
    >
      <form onSubmit={createTest}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Utterance">
            <input
              required
              ref={utteranceInput}
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
          <FormGroup label="Intent">
            <HTMLSelect
              tabIndex={2}
              fill
              options={intents.map(x => ({ value: x, label: x }))}
              onChange={e => setEquals(e.target.value)}
              value={equals}
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type="submit" tabIndex={3} intent={Intent.PRIMARY} disabled={!isValid}>
              Create Test
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
