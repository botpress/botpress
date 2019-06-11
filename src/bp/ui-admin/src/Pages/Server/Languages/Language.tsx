import React, { FC, SFC, useState } from 'react'
import { Button, Progress } from 'reactstrap'

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
  const value = Math.round((props.current / props.total) * 100)
  return (
    <Progress animated value={value}>
      {value > 10 && `${value}%`}
    </Progress>
  )
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
          <Button size='sm' color='primary' outline onClick={installLanguage}>
            Install
          </Button>
        )}
        {props.allowActions && props.installed && !props.loaded && (
          <Button disabled={modelLoading} size='sm' color='primary' outline onClick={loadLanguage}>
            {modelLoading ? 'loading' : 'Load'}
          </Button>
        )}
        {props.allowActions && props.installed && (
          <Button size='sm' color='primary' outline onClick={deleteLanguage}>
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

export default Language
