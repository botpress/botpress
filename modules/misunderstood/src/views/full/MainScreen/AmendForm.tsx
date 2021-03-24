import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import { AxiosStatic } from 'axios'
import { lang } from 'botpress/shared'
import React from 'react'

import { ApiFlaggedEvent, RESOLUTION_TYPE } from '../../../types'
import StickyActionBar from '../StickyActionBar'

import IntentPicker from './IntentPicker'
import QnAPicker from './QnAPicker'
import style from './style.scss'

interface Props {
  axios: AxiosStatic
  language: string
  event: ApiFlaggedEvent | null
  mode: RESOLUTION_TYPE
  resolution: string | null
  resolutionParams: object | null
  setMode: (mode: RESOLUTION_TYPE) => void
  onSelect: (resolution: string | null) => void
  onParamsUpdate: (resolutionParams: object | null) => void
  onSave: () => void
  onCancel: () => void
}

const AmendForm = ({
  axios,
  language,
  event,
  mode,
  setMode,
  resolution,
  resolutionParams,
  onSelect,
  onParamsUpdate,
  onSave,
  onCancel
}: Props) => (
  <div className={style.amendForm}>
    <h4>
      {lang.tr('module.misunderstood.whatIsMessageType')}
      <br />
      <ButtonGroup className={style.messageTypeBtnGroup}>
        <Button
          disabled={mode !== RESOLUTION_TYPE.intent && !!resolution}
          onClick={() => {
            if (mode === RESOLUTION_TYPE.intent) {
              return
            }
            setMode(RESOLUTION_TYPE.intent)
          }}
          intent={mode === RESOLUTION_TYPE.intent ? Intent.SUCCESS : Intent.NONE}
        >
          {lang.tr('module.misunderstood.intent')}
        </Button>
        <Button
          disabled={mode !== RESOLUTION_TYPE.qna && !!resolution}
          onClick={() => {
            if (mode === RESOLUTION_TYPE.qna) {
              return
            }
            setMode(RESOLUTION_TYPE.qna)
          }}
          intent={mode === RESOLUTION_TYPE.qna ? Intent.SUCCESS : Intent.NONE}
        >
          {lang.tr('module.misunderstood.qna')}
        </Button>
        {mode != null && (
          <Button
            onClick={() => {
              setMode(null)
              onSelect(null)
            }}
            icon="undo"
          >
            {lang.tr('undo')}
          </Button>
        )}
      </ButtonGroup>
    </h4>

    {mode === RESOLUTION_TYPE.qna && (
      <div className={style.amendFormPicker}>
        <QnAPicker axios={axios} language={language} selected={resolution} onSelect={onSelect} />
      </div>
    )}

    {mode === RESOLUTION_TYPE.intent && (
      <div className={style.amendFormPicker}>
        <IntentPicker
          axios={axios}
          language={language}
          event={event}
          selected={resolution}
          params={resolutionParams}
          onSelect={onSelect}
          onParamsUpdate={onParamsUpdate}
        />
      </div>
    )}

    <StickyActionBar>
      <Button onClick={onCancel} icon="cross" intent={Intent.NONE}>
        {lang.tr('cancel')}
      </Button>
      <Button onClick={onSave} icon="tick" intent={Intent.SUCCESS} disabled={!mode || !resolution}>
        {lang.tr('save')}
      </Button>
    </StickyActionBar>
  </div>
)

export default AmendForm
