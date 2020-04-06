import { Condition } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'
import SingleParam from '../SingleParam'

interface Props {
  condition: Condition
  updateParams: (params: any) => void
  params?: any
}

const InputParams: FC<Props> = props => {
  const updateParam = (key: string, value: any) => {
    props.updateParams({ ...props.params, [key]: value })
  }

  return (
    <div className={style.inputParamWrapper}>
      {Object.keys(props.condition.params).map(key => {
        const { defaultValue, label, type, list } = props.condition.params[key]
        const value = props.params?.[key]

        if (!value && defaultValue) {
          updateParam(key, defaultValue)
        }

        return (
          <SingleParam
            key={label}
            label={label}
            value={value}
            type={type}
            list={list}
            updateValue={val => updateParam(key, val)}
          />
        )
      })}
    </div>
  )
}

export default InputParams
