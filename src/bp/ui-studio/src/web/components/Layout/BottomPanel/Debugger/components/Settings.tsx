import { Button, FormGroup, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import React, { useEffect, useState } from 'react'

import style from './style.scss'
import ConfigEditor from './ConfigEditor'
import RawPayloadSender from './RawPayloadSender'

const Settings = props => {
  const [userId, setUserId] = useState('')
  const [externalAuthToken, setExternalAuthToken] = useState('')

  useEffect(() => {
    if (props.config) {
      const parsed = JSON.parse(props.config)

      setUserId(parsed.userId)
      setExternalAuthToken(parsed.externalAuthToken)
    }
  }, [props.config])

  if (!props.config) {
    return null
  }

  const applyBasicConfig = () => {
    try {
      window.botpressWebChat.mergeConfig({ userId, externalAuthToken })
      toast.success('bottomPanel.debugger.settings.confUpdated')
    } catch (err) {
      toast.failure('bottomPanel.debugger.settings.confUpdatedError')
    }
  }

  return (
    <div className={style.flex}>
      <div>
        <h5>{lang.tr('bottomPanel.debugger.settings.basic')}</h5>
        <FormGroup
          label={lang.tr('bottomPanel.debugger.settings.userId')}
          helperText={lang.tr('bottomPanel.debugger.settings.userIdHelper')}
        >
          <InputGroup
            value={userId}
            onChange={e => setUserId(e.currentTarget.value)}
            placeholder={lang.tr('bottomPanel.debugger.settings.userIdPlaceholder')}
          />
        </FormGroup>
        <FormGroup
          label={lang.tr('bottomPanel.debugger.settings.authToken')}
          helperText={lang.tr('bottomPanel.debugger.settings.authTokenHelper')}
        >
          <InputGroup
            value={externalAuthToken}
            onChange={e => setExternalAuthToken(e.currentTarget.value)}
            placeholder={lang.tr('bottomPanel.debugger.settings.authTokenPlaceholder')}
          />
        </FormGroup>

        <Button text={lang.tr('save')} onClick={applyBasicConfig} intent={Intent.PRIMARY} />
      </div>

      <div className={style.spaced}>
        <h5>{lang.tr('bottomPanel.debugger.settings.advanced')}</h5>
        <div className={style.flex}>
          <ConfigEditor config={props.config} />
          <RawPayloadSender />
        </div>
      </div>
    </div>
  )
}

export default Settings
