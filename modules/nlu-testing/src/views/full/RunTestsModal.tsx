import { Button, Classes, Dialog, FormGroup, HTMLSelect, Intent } from '@blueprintjs/core'
import React, { FC, useEffect, useRef, useState } from 'react'

import { Test, TestFailure, TestingAPI, TestResult } from './api'

interface Props {
  test?: Test
  api: TestingAPI
  visible: boolean
  hide: () => void
  onUpdate: (testId: string, result: TestResult, reason: TestFailure) => void
}

export const RunTestsModal: FC<Props> = props => {
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

  const reportUpdate = () => {
    // props.onUpdate()
  }

  return (
    <Dialog
      title="NLU Tests > Running tests"
      icon="updated"
      isOpen={props.visible}
      onClose={props.hide}
      transitionDuration={0}
    >
      <div className={Classes.DIALOG_BODY}>
        <div>Running test (1) of (3)</div>
        <div>Progressbar</div>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button type="submit" tabIndex={3} intent={Intent.DANGER}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
