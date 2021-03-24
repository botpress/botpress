import { Condition } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'

import SingleParam from '../SingleParam'
import style from '../style.scss'

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
        const { defaultValue, label } = props.condition.params[key]
        const value = props.params?.[key]

        if (value === undefined && defaultValue !== undefined) {
          updateParam(key, defaultValue)
        }

        return (
          <SingleParam
            key={label}
            {...props.condition.params[key]}
            value={value}
            updateValue={val => updateParam(key, val)}
          />
        )
      })}
    </div>
  )
}

export default InputParams
