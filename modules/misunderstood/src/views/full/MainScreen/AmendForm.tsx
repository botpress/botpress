import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import { AxiosStatic } from 'axios'
import React from 'react'

import { RESOLUTION_TYPE } from '../../../types'

import style from './style.scss'
import QnAPicker from './QnAPicker'

interface Props {
  axios: AxiosStatic
  language: string
  mode: RESOLUTION_TYPE
  resolution: string | null
  resolutionParams: string | object | null
  setMode: (mode: RESOLUTION_TYPE) => void
  onUpdate: (resolution: string | null, resolutionParams?: string | object | null) => void
  onSave: () => void
  onCancel: () => void
}

const AmendForm = ({
  axios,
  language,
  mode,
  setMode,
  resolution,
  resolutionParams,
  onUpdate,
  onSave,
  onCancel
}: Props) => (
    <div className={style.amendForm}>
      <h4>
        What is this message type?&nbsp;
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
      </h4>

      {mode === RESOLUTION_TYPE.qna && (
        <div className={style.amendFormPicker}>
          <QnAPicker axios={axios} language={language} selected={resolution} onSelect={(id: string | null) => {
            onUpdate(id)
          }} />
        </div>
      )}

      <ButtonGroup large>
        <Button onClick={onSave} icon="tick" intent={Intent.SUCCESS} disabled={!mode || !resolution}>
          Save
        </Button>
        <Button onClick={onCancel} icon="cross" intent={Intent.NONE}>
          Cancel
        </Button>
      </ButtonGroup>
    </div>
  )

export default AmendForm
