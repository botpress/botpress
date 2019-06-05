import React, { FC } from 'react'
import { Button } from 'reactstrap'

interface Props {
  language: {
    code: string
    flag: string
    name: string
  }
  installed: boolean
  allowActions: boolean
  loaded: boolean
}

const Language: FC<Props> = props => {
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
          <Button size='sm' color='primary' outline>
            Remove
          </Button>
        )}
      </span>
    </div>
  )
}

export default Language
