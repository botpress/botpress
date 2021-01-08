import { Button, FormGroup, Intent, TextArea } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import jsonlintMod from 'jsonlint-mod'
import React, { useState } from 'react'

import style from './style.scss'

const RawPayloadSender = () => {
  const [payload, setPayload] = useState('{"type": "text", "text": "Hello!"}')
  const [isValid, setValid] = useState(true)
  const [error, setError] = useState('')

  const updatePayload = payload => {
    try {
      setPayload(payload)
      jsonlintMod.parse(payload)
      setValid(true)
      setError('')
    } catch (e) {
      setValid(false)
      setError(e.message)
    }
  }

  const send = () => {
    try {
      window.botpressWebChat.sendPayload(JSON.parse(payload))
      toast.success('bottomPanel.debugger.settings.payloadSent')
    } catch (err) {
      toast.failure('bottomPanel.debugger.settings.payloadSentError', err)
    }
  }

  return (
    <div className={style.spaced}>
      <FormGroup
        label={lang.tr('bottomPanel.debugger.settings.sendRawPayloads')}
        helperText={lang.tr('bottomPanel.debugger.settings.sendRawPayloadsHelper')}
      >
        <TextArea
          name="rawPayload"
          value={payload}
          onChange={e => updatePayload(e.currentTarget.value)}
          className={style.textArea}
          rows={7}
          placeholder={lang.tr('bottomPanel.debugger.settings.sendRawPayloadsPlaceholder')}
        />
      </FormGroup>

      {error && <div className={style.error}>{error}</div>}

      <Button
        text={lang.tr('bottomPanel.debugger.settings.saveRawPayloads')}
        onClick={send}
        disabled={!isValid}
        intent={Intent.PRIMARY}
      />
    </div>
  )
}

export default RawPayloadSender
