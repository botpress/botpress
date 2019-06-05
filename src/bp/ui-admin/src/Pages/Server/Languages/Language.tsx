import Axios from 'axios'
import React, { FC } from 'react'
import { Button } from 'reactstrap'

import { LanguageSource } from './typings'

interface Props {
  language: {
    code: string
    flag: string
    name: string
  }
  installed: boolean
  allowActions: boolean
  loaded: boolean
  languageSource: LanguageSource
}

const Language: FC<Props> = props => {
  const deleteLanguage = async () => {
    // TODO use auth token if necessary  ==> generage api client for this
    await Axios.delete(`${props.languageSource.endpoint}/languages/${props.language.code}`)
  }

  return (
    <div className='language'>
      <span>
        <img src={props.language.flag} alt={props.language.code} />
        <span>{props.language.name}</span>
      </span>
      <span>
        {props.allowActions && !props.installed && (
          <Button size='sm' color='primary' outline>
            Install
          </Button>
        )}
        {props.allowActions && props.installed && !props.loaded && (
          <Button size='sm' color='primary' outline>
            Load
          </Button>
        )}
        {props.allowActions && props.loaded && (
          <Button size='sm' color='primary' outline onClick={deleteLanguage}>
            Remove
          </Button>
        )}
      </span>
    </div>
  )
}

export default Language
