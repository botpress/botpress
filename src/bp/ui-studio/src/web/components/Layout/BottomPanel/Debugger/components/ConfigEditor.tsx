import { Button, FormGroup, Intent, TextArea } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import jsonlintMod from 'jsonlint-mod'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  config: any
}

const ConfigEditor: FC<Props> = props => {
  const [config, setConfig] = useState('')
  const [isValid, setValid] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setConfig(props.config)
  }, [props.config])

  const updateConfig = payload => {
    try {
      setConfig(payload)
      jsonlintMod.parse(payload)

      setValid(true)
      setError('')
    } catch (e) {
      setValid(false)
      setError(e.message)
    }
  }

  const saveConfig = () => {
    try {
      window.botpressWebChat.configure(JSON.parse(config))
      toast.success('bottomPanel.debugger.settings.confUpdated')
    } catch (err) {
      toast.failure('bottomPanel.debugger.settings.confUpdatedError')
    }
  }

  return (
    <div>
      <FormGroup
        label={lang.tr('bottomPanel.debugger.settings.editConf')}
        helperText={lang.tr('bottomPanel.debugger.settings.editConfHelper')}
      >
        <TextArea
          name="config"
          value={config}
          onChange={e => updateConfig(e.currentTarget.value)}
          className={style.textArea}
          rows={7}
          placeholder={lang.tr('bottomPanel.debugger.settings.editConfPlaceholder')}
        />
      </FormGroup>

      {error && <div className={style.error}>{error}</div>}

      <Button text={lang.tr('apply')} onClick={saveConfig} disabled={!isValid} intent={Intent.PRIMARY}></Button>
    </div>
  )
}

export default ConfigEditor
