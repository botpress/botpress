import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import React from 'react'

import { RESOLUTION_TYPE } from '../../../types'

import style from './style.scss'

const AmendForm = ({ mode, setMode }) => (
  <div className={style.amendForm}>
    <h5>What is this message type?</h5>

    <ButtonGroup>
      <Button
        onClick={() => {
          if (mode === RESOLUTION_TYPE.intent) {
            return
          }
          setMode(RESOLUTION_TYPE.intent)
        }}
        intent={mode === RESOLUTION_TYPE.intent ? Intent.SUCCESS : Intent.NONE}
      >
        Goal
      </Button>
      <Button
        onClick={() => {
          if (mode === RESOLUTION_TYPE.qna) {
            return
          }
          setMode(RESOLUTION_TYPE.qna)
        }}
        intent={mode === RESOLUTION_TYPE.qna ? Intent.SUCCESS : Intent.NONE}
      >
        Query
      </Button>
      {mode != null && (
        <Button
          onClick={() => {
            setMode(null)
          }}
          icon="undo"
        >
          Undo
        </Button>
      )}
    </ButtonGroup>
  </div>
)

export default AmendForm
