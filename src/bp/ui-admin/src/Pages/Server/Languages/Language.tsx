import { Button, ProgressBar } from '@blueprintjs/core'
import React, { FC, SFC, useState } from 'react'

import { getLanguageSourceClient } from './api'
import { LanguageSource } from './typings'

interface Props {
  language: {
    code: string
    flag: string
    name: string
    size?: number
  }
  installed: boolean
  allowActions: boolean
  loaded: boolean
  languageSource: LanguageSource
  downloadProgress?: any
}

const DownloadProgress: SFC<{ current: number; total: number }> = props => {
  const value = props.current / props.total
  return <ProgressBar value={value} />
}

const Language: FC<Props> = props => {
  const [modelLoading, setLoading] = useState(false)

  const client = getLanguageSourceClient(props.languageSource)

  const deleteLanguage = async () => {
    await client.delete(`/languages/${props.language.code}`)
  }

  const installLanguage = async () => {
    await client.post(`/languages/${props.language.code}`)
  }

  const loadLanguage = async () => {
    setLoading(true)
    try {
      await client.post(`/languages/${props.language.code}/load`)
    } catch (err) {
      console.log('error loading model')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='language'>
      <div>
        <div className='flag'>
          <img src={props.language.flag} alt={props.language.code} />
        </div>
        <span>{props.language.name}</span>
      </div>
      <div className='action'>
        {props.downloadProgress && (
          <DownloadProgress current={props.downloadProgress.progress.size} total={props.language.size!} />
        )}
        {props.allowActions && !props.downloadProgress && !props.installed && (
          <Button small onClick={installLanguage} minimal icon='import' />
        )}
        {props.allowActions && props.installed && !props.loaded && (
          <Button disabled={modelLoading} minimal icon='updated' onClick={loadLanguage}>
            {modelLoading ? 'loading' : 'Load'}
          </Button>
        )}
        {props.allowActions && props.installed && (
          <Button disabled={modelLoading} icon='cross' minimal onClick={deleteLanguage} />
        )}
      </div>
    </div>
  )
}

export default Language
