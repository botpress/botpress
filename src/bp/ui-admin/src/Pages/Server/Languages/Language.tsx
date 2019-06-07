import Axios from 'axios'
import React, { FC, SFC } from 'react'
import { Button, Progress } from 'reactstrap'

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
  const deleteLanguage = async () => {
    // TODO use auth token if necessary  ==> generage api client for this
    await Axios.delete(`${props.languageSource.endpoint}/languages/${props.language.code}`)
  }

  const installLanguage = async () => {
    // TODO use auth token if necessary  ==> generage api client for this
    await Axios.post(`${props.languageSource.endpoint}/languages/${props.language.code}`)
  }

  const loadLanguage = async () => {
    // TODO use auth token if necessary  ==> generage api client for this
    await Axios.post(`${props.languageSource.endpoint}/languages/${props.language.code}/load`)
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
          <Button size='sm' color='primary' outline onClick={loadLanguage}>
            Load
          </Button>
        )}
        {props.allowActions && props.loaded && (
          <Button size='sm' color='primary' outline onClick={deleteLanguage}>
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

export default Language
