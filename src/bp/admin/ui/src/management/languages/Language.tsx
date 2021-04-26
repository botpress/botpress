import { Button, Position, ProgressBar, Tooltip } from '@blueprintjs/core'
import { confirmDialog, lang } from 'botpress/shared'
import React, { FC, SFC, useState } from 'react'

import api from '~/app/api'
import style from './style.scss'
import { LanguageSource } from './typings'

interface Props {
  language: {
    code: string
    name: string
    size?: number
  }
  installed?: boolean
  allowActions: boolean
  loaded?: boolean
  languageSource: LanguageSource
  downloadProgress?: any
}

const units = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb']
function bytesToFormattedString(bytes: number): string {
  const power = Math.log2(bytes)
  const unitNumber = Math.min(Math.floor(power / 10), 4)
  const mantisse = bytes / Math.pow(2, unitNumber * 10)
  return `${mantisse.toFixed(0)} ${units[unitNumber]}`
}

const DownloadProgress: SFC<{ current: number; total: number }> = props => {
  const value = props.current / props.total
  const formattedLoadingState = `${bytesToFormattedString(props.current)} / ${bytesToFormattedString(props.total)}`
  return (
    <Tooltip content={formattedLoadingState} position={Position.TOP}>
      <div style={{ width: '250px' }}>
        <ProgressBar value={value} />
      </div>
    </Tooltip>
  )
}

const Language: FC<Props> = props => {
  const [modelLoading, setLoading] = useState(false)

  const deleteLanguage = async () => {
    if (
      await confirmDialog(lang.tr('admin.languages.confirmDelete', { language: props.language.name }), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      await api.getSecured().post(`/admin/management/languages/${props.language.code}/delete`)
    }
  }

  const installLanguage = async () => {
    await api.getSecured().post(`/admin/management/languages/${props.language.code}`)
  }

  const loadLanguage = async () => {
    setLoading(true)
    try {
      await api.getSecured({ timeout: 10000 }).post(`/admin/management/languages/${props.language.code}/load`)
    } catch (err) {
      console.error('error loading model')
    } finally {
      setLoading(false)
    }
  }

  const requireFlag = (code: string) => {
    try {
      const flag = require(`./flags/${code}.svg`)
      return flag.default || flag
    } catch {
      return requireFlag('missing')
    }
  }

  return (
    <div className={style.language}>
      <div>
        <div className={style.flag}>
          <img src={requireFlag(props.language.code)} alt={props.language.code} />
        </div>
        <span>{props.language.name}</span>
      </div>
      <div className={style.action}>
        {props.downloadProgress && (
          <DownloadProgress current={props.downloadProgress.progress.size} total={props.language.size!} />
        )}
        {props.allowActions && !props.downloadProgress && !props.installed && (
          <Button small onClick={installLanguage} minimal icon="import" />
        )}
        {props.allowActions && props.installed && !props.loaded && (
          <Button disabled={modelLoading} minimal icon="updated" onClick={loadLanguage}>
            {modelLoading ? 'loading' : 'Load'}
          </Button>
        )}
        {props.allowActions && props.installed && (
          <Button disabled={modelLoading} icon="cross" minimal onClick={deleteLanguage} />
        )}
      </div>
    </div>
  )
}

export default Language
